import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Attempt, AttemptItem, PerTopicStats } from '../../shared/types/database';
import { IAttemptRepository } from './interfaces';

export class AttemptRepository implements IAttemptRepository {
  constructor(private db: QuickSQLiteConnection) {}

  private mapRowToAttempt(row: any): Attempt {
    return {
      id: row.id,
      templateId: row.template_id,
      packId: row.pack_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      score: row.score,
      summary: row.summary ? JSON.parse(row.summary) : undefined,
      deviceGuid: row.device_guid,
    };
  }

  private mapRowToAttemptItem(row: any): AttemptItem {
    return {
      attemptId: row.attempt_id,
      questionId: row.question_id,
      given: row.given ? JSON.parse(row.given) : undefined,
      correct: Boolean(row.correct),
      timeSpentMs: row.time_spent_ms,
    };
  }

  async getById(id: string): Promise<Attempt | null> {
    const result = this.db.execute(
      'SELECT * FROM attempt WHERE id = ?',
      [id]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToAttempt(result.rows._array[0]);
    }
    return null;
  }

  async startAttempt(templateId: string | undefined, packId: string, deviceGuid: string): Promise<string> {
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = Date.now();

    this.db.execute(
      'INSERT INTO attempt (id, template_id, pack_id, started_at, device_guid) VALUES (?, ?, ?, ?, ?)',
      [attemptId, templateId || null, packId, startedAt, deviceGuid]
    );

    return attemptId;
  }

  async recordAnswer(
    attemptId: string,
    questionId: string,
    selectedIds: string[],
    timeSpentMs: number
  ): Promise<void> {
    // Get the question to determine correctness
    const questionResult = this.db.execute(
      'SELECT correct, correct_order, type FROM question WHERE id = ?',
      [questionId]
    );

    if (!questionResult.rows || questionResult.rows.length === 0) {
      throw new Error(`Question not found: ${questionId}`);
    }

    const question = questionResult.rows._array[0];
    let isCorrect = false;

    // Calculate correctness based on question type
    switch (question.type) {
      case 'single':
        const correctSingle = question.correct ? JSON.parse(question.correct) : [];
        isCorrect = selectedIds.length === 1 && correctSingle.includes(selectedIds[0]);
        break;
      
      case 'multi':
        const correctMulti = question.correct ? JSON.parse(question.correct) : [];
        isCorrect = selectedIds.length === correctMulti.length &&
                   selectedIds.every(id => correctMulti.includes(id));
        break;
      
      case 'order':
        const correctOrder = question.correct_order ? JSON.parse(question.correct_order) : [];
        isCorrect = JSON.stringify(selectedIds) === JSON.stringify(correctOrder);
        break;
      
      case 'scenario':
        // Same logic as single for now
        const correctScenario = question.correct ? JSON.parse(question.correct) : [];
        isCorrect = selectedIds.length === 1 && correctScenario.includes(selectedIds[0]);
        break;
    }

    // Insert or update attempt item
    this.db.execute(
      `INSERT OR REPLACE INTO attempt_item 
       (attempt_id, question_id, given, correct, time_spent_ms) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        attemptId,
        questionId,
        JSON.stringify(selectedIds),
        isCorrect ? 1 : 0,
        timeSpentMs,
      ]
    );
  }

  async finalizeAttempt(attemptId: string): Promise<{
    score: number;
    perTopicStats: PerTopicStats;
  }> {
    // Get all attempt items with question topics
    const result = this.db.execute(
      `SELECT ai.correct, q.topic_ids 
       FROM attempt_item ai 
       JOIN question q ON ai.question_id = q.id 
       WHERE ai.attempt_id = ?`,
      [attemptId]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error('No questions found for attempt');
    }

    const items = result.rows._array;
    let totalCorrect = 0;
    const topicStats: PerTopicStats = {};

    // Calculate per-topic statistics
    items.forEach(item => {
      const isCorrect = Boolean(item.correct);
      const topics = JSON.parse(item.topic_ids);

      if (isCorrect) totalCorrect++;

      topics.forEach((topicId: string) => {
        if (!topicStats[topicId]) {
          topicStats[topicId] = { correct: 0, total: 0 };
        }
        topicStats[topicId].total++;
        if (isCorrect) topicStats[topicId].correct++;
      });
    });

    const score = (totalCorrect / items.length) * 100;
    const endedAt = Date.now();

    // Update attempt with final score and stats
    this.db.execute(
      'UPDATE attempt SET ended_at = ?, score = ?, summary = ? WHERE id = ?',
      [endedAt, score, JSON.stringify(topicStats), attemptId]
    );

    return { score, perTopicStats: topicStats };
  }

  async getAttemptItems(attemptId: string): Promise<AttemptItem[]> {
    const result = this.db.execute(
      'SELECT * FROM attempt_item WHERE attempt_id = ?',
      [attemptId]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToAttemptItem(row));
    }
    return [];
  }

  async getRecentAttempts(deviceGuid: string, limit: number = 10): Promise<Attempt[]> {
    const result = this.db.execute(
      'SELECT * FROM attempt WHERE device_guid = ? ORDER BY started_at DESC LIMIT ?',
      [deviceGuid, limit]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToAttempt(row));
    }
    return [];
  }

  async updateAttempt(attempt: Attempt): Promise<void> {
    this.db.execute(
      `UPDATE attempt SET template_id = ?, pack_id = ?, started_at = ?, 
       ended_at = ?, score = ?, summary = ?, device_guid = ? WHERE id = ?`,
      [
        attempt.templateId || null,
        attempt.packId,
        attempt.startedAt,
        attempt.endedAt || null,
        attempt.score || null,
        attempt.summary ? JSON.stringify(attempt.summary) : null,
        attempt.deviceGuid,
        attempt.id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    // Delete attempt items first (foreign key constraint)
    this.db.execute('DELETE FROM attempt_item WHERE attempt_id = ?', [id]);
    this.db.execute('DELETE FROM attempt WHERE id = ?', [id]);
  }
}

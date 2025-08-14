import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Attempt } from '../../shared/types/database';
import { IAttemptRepository } from './interfaces';

export interface PerTopicStats {
  [topicId: string]: {
    correct: number;
    total: number;
    percentage: number;
  };
}

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

  async startAttempt(sessionId: string, templateId: string | null, packId: string): Promise<void> {
    // Get device GUID from secure storage
    const { SecureStorage } = await import('../storage/SecureStorage');
    const secureStorage = SecureStorage.getInstance();
    const deviceGuid = secureStorage.getDeviceGuid();

    this.db.execute(
      `INSERT INTO attempt (id, template_id, pack_id, started_at, device_guid) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, templateId, packId, Date.now(), deviceGuid]
    );
  }

  async recordAnswer(
    attemptId: string,
    questionId: string,
    selectedIds: string[],
    timeSpentMs: number,
    isCorrect: boolean
  ): Promise<void> {
    this.db.execute(
      `INSERT OR REPLACE INTO attempt_item 
       (attempt_id, question_id, given, correct, time_spent_ms) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        attemptId,
        questionId,
        JSON.stringify(selectedIds),
        isCorrect ? 1 : 0,
        timeSpentMs
      ]
    );
  }

  async finalizeAttempt(
    attemptId: string,
    score: number,
    summary: PerTopicStats
  ): Promise<void> {
    this.db.execute(
      `UPDATE attempt SET ended_at = ?, score = ?, summary = ? WHERE id = ?`,
      [Date.now(), score, JSON.stringify(summary), attemptId]
    );
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

  async getByDeviceGuid(deviceGuid: string, limit = 50): Promise<Attempt[]> {
    const result = this.db.execute(
      'SELECT * FROM attempt WHERE device_guid = ? ORDER BY started_at DESC LIMIT ?',
      [deviceGuid, limit]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToAttempt(row));
    }
    return [];
  }

  async getRecentAttempts(limit = 10): Promise<Attempt[]> {
    const result = this.db.execute(
      'SELECT * FROM attempt ORDER BY started_at DESC LIMIT ?',
      [limit]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToAttempt(row));
    }
    return [];
  }

  async getAttemptItems(attemptId: string): Promise<{
    questionId: string;
    given: string[];
    correct: boolean;
    timeSpentMs: number;
  }[]> {
    const result = this.db.execute(
      'SELECT * FROM attempt_item WHERE attempt_id = ?',
      [attemptId]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => ({
        questionId: row.question_id,
        given: JSON.parse(row.given),
        correct: row.correct === 1,
        timeSpentMs: row.time_spent_ms,
      }));
    }
    return [];
  }

  async deleteAttempt(id: string): Promise<void> {
    // Delete attempt items first (foreign key constraint)
    this.db.execute('DELETE FROM attempt_item WHERE attempt_id = ?', [id]);
    
    // Delete attempt
    this.db.execute('DELETE FROM attempt WHERE id = ?', [id]);
  }

  async getStats(deviceGuid?: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    totalTimeSpent: number;
  }> {
    let query = 'SELECT COUNT(*) as total, AVG(score) as avg_score, MAX(score) as best_score FROM attempt WHERE ended_at IS NOT NULL';
    const params: any[] = [];

    if (deviceGuid) {
      query += ' AND device_guid = ?';
      params.push(deviceGuid);
    }

    const result = this.db.execute(query, params);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows._array[0];
      
      // Calculate total time spent
      let timeQuery = 'SELECT SUM(time_spent_ms) as total_time FROM attempt_item ai JOIN attempt a ON ai.attempt_id = a.id WHERE a.ended_at IS NOT NULL';
      const timeParams: any[] = [];
      
      if (deviceGuid) {
        timeQuery += ' AND a.device_guid = ?';
        timeParams.push(deviceGuid);
      }
      
      const timeResult = this.db.execute(timeQuery, timeParams);
      const totalTimeSpent = timeResult.rows && timeResult.rows.length > 0 
        ? timeResult.rows._array[0].total_time || 0 
        : 0;

      return {
        totalAttempts: row.total || 0,
        averageScore: row.avg_score || 0,
        bestScore: row.best_score || 0,
        totalTimeSpent,
      };
    }
    
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
    };
  }
}
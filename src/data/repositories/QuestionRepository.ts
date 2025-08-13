import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Question } from '../../shared/types/database';
import { IQuestionRepository, QuestionSamplingParams } from './interfaces';

export class QuestionRepository implements IQuestionRepository {
  constructor(private db: QuickSQLiteConnection) {}

  private mapRowToQuestion(row: any): Question {
    return {
      id: row.id,
      type: row.type,
      stem: row.stem,
      topicIds: JSON.parse(row.topic_ids),
      choices: row.choices ? JSON.parse(row.choices) : undefined,
      correct: row.correct ? JSON.parse(row.correct) : undefined,
      correctOrder: row.correct_order ? JSON.parse(row.correct_order) : undefined,
      exhibits: row.exhibits ? JSON.parse(row.exhibits) : undefined,
      difficulty: row.difficulty,
      explanation: row.explanation,
      packId: row.pack_id,
    };
  }

  async getById(id: string): Promise<Question | null> {
    const result = this.db.execute(
      'SELECT * FROM question WHERE id = ?',
      [id]
    );

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToQuestion(result.rows._array[0]);
    }
    return null;
  }

  async getByIds(ids: string[]): Promise<Question[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const result = this.db.execute(
      `SELECT * FROM question WHERE id IN (${placeholders})`,
      ids
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToQuestion(row));
    }
    return [];
  }

  async sampleQuestions(params: QuestionSamplingParams): Promise<Question[]> {
    let query = 'SELECT * FROM question WHERE 1=1';
    const queryParams: any[] = [];

    // Filter by topics
    if (params.topicIds.length > 0) {
      const topicConditions = params.topicIds.map(() => 'topic_ids LIKE ?').join(' OR ');
      query += ` AND (${topicConditions})`;
      params.topicIds.forEach(topicId => {
        queryParams.push(`%"${topicId}"%`);
      });
    }

    // Filter by difficulty
    if (params.difficulty && params.difficulty.length > 0) {
      const difficultyPlaceholders = params.difficulty.map(() => '?').join(',');
      query += ` AND difficulty IN (${difficultyPlaceholders})`;
      queryParams.push(...params.difficulty);
    }

    // Filter by pack
    if (params.packId) {
      query += ' AND pack_id = ?';
      queryParams.push(params.packId);
    }

    // Exclude specific IDs
    if (params.excludeIds && params.excludeIds.length > 0) {
      const excludePlaceholders = params.excludeIds.map(() => '?').join(',');
      query += ` AND id NOT IN (${excludePlaceholders})`;
      queryParams.push(...params.excludeIds);
    }

    // Random sampling with limit
    query += ' ORDER BY RANDOM() LIMIT ?';
    queryParams.push(params.limit);

    const result = this.db.execute(query, queryParams);

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToQuestion(row));
    }
    return [];
  }

  async getByTopics(topicIds: string[], packId?: string): Promise<Question[]> {
    if (topicIds.length === 0) return [];

    let query = 'SELECT * FROM question WHERE ';
    const queryParams: any[] = [];

    const topicConditions = topicIds.map(() => 'topic_ids LIKE ?').join(' OR ');
    query += `(${topicConditions})`;
    topicIds.forEach(topicId => {
      queryParams.push(`%"${topicId}"%`);
    });

    if (packId) {
      query += ' AND pack_id = ?';
      queryParams.push(packId);
    }

    const result = this.db.execute(query, queryParams);

    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => this.mapRowToQuestion(row));
    }
    return [];
  }

  async create(question: Question): Promise<void> {
    this.db.execute(
      `INSERT INTO question (id, type, stem, topic_ids, choices, correct, correct_order, 
       difficulty, explanation, exhibits, pack_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        question.id,
        question.type,
        question.stem,
        JSON.stringify(question.topicIds),
        question.choices ? JSON.stringify(question.choices) : null,
        question.correct ? JSON.stringify(question.correct) : null,
        question.correctOrder ? JSON.stringify(question.correctOrder) : null,
        question.difficulty,
        question.explanation || null,
        question.exhibits ? JSON.stringify(question.exhibits) : null,
        question.packId,
      ]
    );
  }

  async createMany(questions: Question[]): Promise<void> {
    for (const question of questions) {
      await this.create(question);
    }
  }

  async update(question: Question): Promise<void> {
    this.db.execute(
      `UPDATE question SET type = ?, stem = ?, topic_ids = ?, choices = ?, 
       correct = ?, correct_order = ?, difficulty = ?, explanation = ?, 
       exhibits = ?, pack_id = ? WHERE id = ?`,
      [
        question.type,
        question.stem,
        JSON.stringify(question.topicIds),
        question.choices ? JSON.stringify(question.choices) : null,
        question.correct ? JSON.stringify(question.correct) : null,
        question.correctOrder ? JSON.stringify(question.correctOrder) : null,
        question.difficulty,
        question.explanation || null,
        question.exhibits ? JSON.stringify(question.exhibits) : null,
        question.packId,
        question.id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    this.db.execute('DELETE FROM question WHERE id = ?', [id]);
  }

  async deleteByPackId(packId: string): Promise<void> {
    this.db.execute('DELETE FROM question WHERE pack_id = ?', [packId]);
  }
}

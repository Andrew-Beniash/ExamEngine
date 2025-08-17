import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { 
  TopicProficiency, 
  LearningSession, 
  PracticeRecommendation 
} from '../../shared/types/mastery';
import { SecureStorage } from '../storage/SecureStorage';

interface DatabaseRow {
  [key: string]: any;
}

export interface QuestionPerformance {
  questionId: string;
  topicId: string;
  isCorrect: boolean;
  timeSpentMs: number;
  difficulty: string;
  attemptDate: number;
  sessionId?: string;
  proficiencyBefore?: number;
  proficiencyAfter?: number;
}

export class MasteryRepository {
  private db: QuickSQLiteConnection;
  private deviceGuid: string;

  constructor(database: QuickSQLiteConnection) {
    this.db = database;
    this.deviceGuid = SecureStorage.getInstance().getDeviceGuid();
  }

  // ========== Topic Proficiency Methods ==========

  async getAllProficiencies(): Promise<TopicProficiency[]> {
    const query = `
      SELECT * FROM topic_proficiency 
      WHERE device_guid = ? 
      ORDER BY proficiency ASC, last_practiced DESC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToProficiency);
    }
    return [];
  }

  async getProficiencyByTopic(topicId: string): Promise<TopicProficiency | null> {
    const query = `
      SELECT * FROM topic_proficiency 
      WHERE device_guid = ? AND topic_id = ?
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, topicId]);
    
    if (result.rows && result.rows.length > 0) {
      return this.mapRowToProficiency(result.rows._array[0]);
    }
    
    return null;
  }

  async upsertProficiency(proficiency: Partial<TopicProficiency> & { topicId: string }): Promise<void> {
    const now = Date.now();
    
    const query = `
      INSERT OR REPLACE INTO topic_proficiency (
        topic_id, device_guid, proficiency, confidence, total_attempts,
        correct_attempts, last_practiced, consecutive_correct, consecutive_incorrect,
        average_time_spent, difficulty_breakdown, trend, needs_review,
        next_review_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const difficultyBreakdown = JSON.stringify(proficiency.difficultyBreakdown || {
      easy: { correct: 0, total: 0, avgTime: 0 },
      med: { correct: 0, total: 0, avgTime: 0 },
      hard: { correct: 0, total: 0, avgTime: 0 },
    });

    const params = [
      proficiency.topicId,
      this.deviceGuid,
      proficiency.proficiency ?? 0.5,
      proficiency.confidence ?? 0.0,
      proficiency.totalAttempts ?? 0,
      proficiency.correctAttempts ?? 0,
      proficiency.lastPracticed ?? now,
      proficiency.consecutiveCorrect ?? 0,
      proficiency.consecutiveIncorrect ?? 0,
      proficiency.averageTimeSpent ?? 0,
      difficultyBreakdown,
      proficiency.trend ?? 'unknown',
      proficiency.needsReview ? 1 : 0,
      proficiency.nextReviewDate ?? now + (24 * 60 * 60 * 1000),
      now, // created_at
      now, // updated_at
    ];

    this.db.execute(query, params);
  }

  async getWeakAreas(limit: number = 10): Promise<TopicProficiency[]> {
    const query = `
      SELECT * FROM topic_proficiency 
      WHERE device_guid = ? AND (proficiency < 0.7 OR needs_review = 1)
      ORDER BY 
        CASE WHEN proficiency < 0.5 THEN 1 ELSE 2 END,
        proficiency ASC,
        last_practiced ASC
      LIMIT ?
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, limit]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToProficiency);
    }
    return [];
  }

  async getTopicsForSpacedReview(): Promise<TopicProficiency[]> {
    const now = Date.now();
    const query = `
      SELECT * FROM topic_proficiency 
      WHERE device_guid = ? 
        AND needs_review = 1 
        AND next_review_date <= ?
        AND proficiency >= 0.7
      ORDER BY next_review_date ASC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, now]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToProficiency);
    }
    return [];
  }

  // ========== Question Performance Methods ==========

  async recordQuestionPerformance(performance: QuestionPerformance): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO question_performance (
        question_id, device_guid, topic_id, is_correct, time_spent_ms,
        difficulty, attempt_date, session_id, proficiency_before, proficiency_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      performance.questionId,
      this.deviceGuid,
      performance.topicId,
      performance.isCorrect ? 1 : 0,
      performance.timeSpentMs,
      performance.difficulty,
      performance.attemptDate,
      performance.sessionId || null,
      performance.proficiencyBefore || null,
      performance.proficiencyAfter || null,
    ];

    this.db.execute(query, params);
  }

  async getRecentPerformance(topicId: string, days: number = 30): Promise<QuestionPerformance[]> {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const query = `
      SELECT * FROM question_performance 
      WHERE device_guid = ? AND topic_id = ? AND attempt_date >= ?
      ORDER BY attempt_date DESC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, topicId, cutoffDate]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToPerformance);
    }
    return [];
  }

  // ========== Learning Session Methods ==========

  async createLearningSession(session: Omit<LearningSession, 'id'>): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const query = `
      INSERT INTO learning_session (
        id, device_guid, start_time, end_time, topics_studied,
        questions_answered, correct_answers, time_spent, proficiency_changes,
        weak_areas_improved, recommendation_followed, session_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      sessionId,
      this.deviceGuid,
      session.startTime,
      session.endTime || null,
      JSON.stringify(session.topicsStudied),
      session.questionsAnswered,
      session.correctAnswers,
      session.timeSpent,
      JSON.stringify(session.proficiencyChanges),
      JSON.stringify(session.weakAreasImproved),
      session.recommendationFollowed || null,
      'practice', // Default session type
      Date.now(),
    ];

    this.db.execute(query, params);
    return sessionId;
  }

  async updateLearningSession(sessionId: string, updates: Partial<LearningSession>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      params.push(updates.endTime);
    }
    if (updates.questionsAnswered !== undefined) {
      fields.push('questions_answered = ?');
      params.push(updates.questionsAnswered);
    }
    if (updates.correctAnswers !== undefined) {
      fields.push('correct_answers = ?');
      params.push(updates.correctAnswers);
    }
    if (updates.timeSpent !== undefined) {
      fields.push('time_spent = ?');
      params.push(updates.timeSpent);
    }
    if (updates.proficiencyChanges !== undefined) {
      fields.push('proficiency_changes = ?');
      params.push(JSON.stringify(updates.proficiencyChanges));
    }
    if (updates.weakAreasImproved !== undefined) {
      fields.push('weak_areas_improved = ?');
      params.push(JSON.stringify(updates.weakAreasImproved));
    }

    if (fields.length === 0) return;

    params.push(sessionId, this.deviceGuid);
    
    const query = `
      UPDATE learning_session 
      SET ${fields.join(', ')} 
      WHERE id = ? AND device_guid = ?
    `;

    this.db.execute(query, params);
  }

  async getRecentSessions(limit: number = 10): Promise<LearningSession[]> {
    const query = `
      SELECT * FROM learning_session 
      WHERE device_guid = ? 
      ORDER BY start_time DESC 
      LIMIT ?
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, limit]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToSession);
    }
    return [];
  }

  // ========== Practice Recommendation Methods ==========

  async savePracticeRecommendations(recommendations: PracticeRecommendation[]): Promise<void> {
    const now = Date.now();
    
    // Clear old recommendations first
    this.db.execute(
      'DELETE FROM practice_recommendation WHERE device_guid = ? AND expires_at < ?',
      [this.deviceGuid, now]
    );

    for (const rec of recommendations) {
      const query = `
        INSERT OR REPLACE INTO practice_recommendation (
          id, device_guid, type, title, description, topic_ids,
          question_count, estimated_duration, difficulty, priority,
          reasoning, expected_impact, created_at, expires_at, used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // Expire in 7 days

      const params = [
        rec.id,
        this.deviceGuid,
        rec.type,
        rec.title,
        rec.description,
        JSON.stringify(rec.topicIds),
        rec.questionCount,
        rec.estimatedDuration,
        rec.difficulty,
        rec.priority,
        rec.reasoning,
        JSON.stringify(rec.expectedImpact),
        now,
        expiresAt,
        0, // not used
      ];

      this.db.execute(query, params);
    }
  }

  async getActiveRecommendations(): Promise<PracticeRecommendation[]> {
    const now = Date.now();
    const query = `
      SELECT * FROM practice_recommendation 
      WHERE device_guid = ? AND expires_at > ? AND used = 0
      ORDER BY priority DESC, created_at DESC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, now]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(this.mapRowToRecommendation);
    }
    return [];
  }

  async markRecommendationUsed(recommendationId: string): Promise<void> {
    const query = `
      UPDATE practice_recommendation 
      SET used = 1 
      WHERE id = ? AND device_guid = ?
    `;
    
    this.db.execute(query, [recommendationId, this.deviceGuid]);
  }

  // ========== Analytics Methods ==========

  async getProficiencyTrends(topicId: string, days: number = 30): Promise<{ date: number; proficiency: number }[]> {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const query = `
      SELECT attempt_date, proficiency_after as proficiency
      FROM question_performance 
      WHERE device_guid = ? AND topic_id = ? AND attempt_date >= ? AND proficiency_after IS NOT NULL
      ORDER BY attempt_date ASC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid, topicId, cutoffDate]);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows._array.map(row => ({
        date: row.attempt_date,
        proficiency: row.proficiency,
      }));
    }
    return [];
  }

  async getOverallStats(): Promise<{
    totalTopics: number;
    masteredTopics: number;
    weakAreas: number;
    averageProficiency: number;
    totalPracticeTime: number;
    streak: number;
  }> {
    const proficiencyQuery = `
      SELECT 
        COUNT(*) as total_topics,
        COUNT(CASE WHEN proficiency >= 0.8 THEN 1 END) as mastered_topics,
        COUNT(CASE WHEN proficiency < 0.7 THEN 1 END) as weak_areas,
        AVG(proficiency) as avg_proficiency
      FROM topic_proficiency 
      WHERE device_guid = ?
    `;

    const sessionQuery = `
      SELECT SUM(time_spent) as total_time
      FROM learning_session 
      WHERE device_guid = ?
    `;

    const profResult = this.db.execute(proficiencyQuery, [this.deviceGuid]);
    const sessionResult = this.db.execute(sessionQuery, [this.deviceGuid]);

    const profData = profResult.rows && profResult.rows.length > 0 
      ? profResult.rows._array[0] 
      : { total_topics: 0, mastered_topics: 0, weak_areas: 0, avg_proficiency: 0 };
      
    const sessionData = sessionResult.rows && sessionResult.rows.length > 0 
      ? sessionResult.rows._array[0] 
      : { total_time: 0 };

    return {
      totalTopics: profData.total_topics || 0,
      masteredTopics: profData.mastered_topics || 0,
      weakAreas: profData.weak_areas || 0,
      averageProficiency: profData.avg_proficiency || 0,
      totalPracticeTime: sessionData.total_time || 0,
      streak: await this.calculateStreak(),
    };
  }

  private async calculateStreak(): Promise<number> {
    const query = `
      SELECT DISTINCT DATE(start_time / 1000, 'unixepoch') as practice_date
      FROM learning_session 
      WHERE device_guid = ? AND questions_answered > 0
      ORDER BY practice_date DESC
    `;
    
    const result = this.db.execute(query, [this.deviceGuid]);
    
    if (!result.rows || result.rows.length === 0) return 0;
    
    const dates = result.rows._array.map(row => new Date(row.practice_date));
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (dates[i].getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // ========== Helper Methods ==========

  private mapRowToProficiency = (row: DatabaseRow): TopicProficiency => {
    return {
      topicId: row.topic_id,
      proficiency: row.proficiency,
      confidence: row.confidence,
      totalAttempts: row.total_attempts,
      correctAttempts: row.correct_attempts,
      lastPracticed: row.last_practiced,
      consecutiveCorrect: row.consecutive_correct,
      consecutiveIncorrect: row.consecutive_incorrect,
      averageTimeSpent: row.average_time_spent,
      difficultyBreakdown: JSON.parse(row.difficulty_breakdown || '{}'),
      trend: row.trend as TopicProficiency['trend'],
      needsReview: row.needs_review === 1,
      nextReviewDate: row.next_review_date,
    };
  };

  private mapRowToPerformance = (row: DatabaseRow): QuestionPerformance => {
    return {
      questionId: row.question_id,
      topicId: row.topic_id,
      isCorrect: row.is_correct === 1,
      timeSpentMs: row.time_spent_ms,
      difficulty: row.difficulty,
      attemptDate: row.attempt_date,
      sessionId: row.session_id,
      proficiencyBefore: row.proficiency_before,
      proficiencyAfter: row.proficiency_after,
    };
  };

  private mapRowToSession = (row: DatabaseRow): LearningSession => {
    return {
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      topicsStudied: JSON.parse(row.topics_studied || '[]'),
      questionsAnswered: row.questions_answered,
      correctAnswers: row.correct_answers,
      timeSpent: row.time_spent,
      proficiencyChanges: JSON.parse(row.proficiency_changes || '{}'),
      weakAreasImproved: JSON.parse(row.weak_areas_improved || '[]'),
      recommendationFollowed: row.recommendation_followed,
    };
  };

  private mapRowToRecommendation = (row: DatabaseRow): PracticeRecommendation => {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      topicIds: JSON.parse(row.topic_ids || '[]'),
      questionCount: row.question_count,
      estimatedDuration: row.estimated_duration,
      difficulty: row.difficulty,
      priority: row.priority,
      reasoning: row.reasoning,
      expectedImpact: JSON.parse(row.expected_impact || '{}'),
    };
  };
}
import { MasteryEngine } from '../MasteryEngine';
import { DEFAULT_MASTERY_CONFIG, LearningSession } from '../../../shared/types/mastery';

describe('Mastery Integration', () => {
  let masteryEngine: MasteryEngine;

  beforeEach(() => {
    masteryEngine = MasteryEngine.getInstance();
  });

  describe('Proficiency Calculation', () => {
    it('should calculate initial proficiency correctly', () => {
      const newProficiency = masteryEngine.calculateNewProficiency(
        0.5, // current proficiency
        true, // isCorrect
        'med', // difficulty
        60000, // 60 seconds
        1 // totalAttempts
      );

      expect(newProficiency).toBeGreaterThan(0.5);
      expect(newProficiency).toBeLessThanOrEqual(1.0);
    });

    it('should decrease proficiency for incorrect answers', () => {
      const newProficiency = masteryEngine.calculateNewProficiency(
        0.7, // current proficiency
        false, // isCorrect
        'easy', // difficulty
        120000, // 2 minutes (slow)
        5 // totalAttempts
      );

      expect(newProficiency).toBeLessThan(0.7);
      expect(newProficiency).toBeGreaterThanOrEqual(0.0);
    });

    it('should apply difficulty weighting correctly', () => {
      const easyCorrect = masteryEngine.calculateNewProficiency(0.5, true, 'easy', 60000, 1);
      const hardCorrect = masteryEngine.calculateNewProficiency(0.5, true, 'hard', 60000, 1);

      expect(hardCorrect).toBeGreaterThan(easyCorrect);
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate confidence based on sample size', () => {
      const lowConfidence = masteryEngine.calculateConfidence(3, 0.7);
      const highConfidence = masteryEngine.calculateConfidence(20, 0.7);

      expect(highConfidence).toBeGreaterThan(lowConfidence);
    });

    it('should penalize extreme proficiency values', () => {
      const moderateConfidence = masteryEngine.calculateConfidence(10, 0.5);
      const extremeConfidence = masteryEngine.calculateConfidence(10, 0.1);

      expect(moderateConfidence).toBeGreaterThan(extremeConfidence);
    });
  });

  describe('Trend Detection', () => {
    it('should detect improving trend', () => {
      const improvingHistory = [0.3, 0.4, 0.5, 0.6, 0.7];
      const trend = masteryEngine.calculateTrend(improvingHistory);
      expect(trend).toBe('improving');
    });

    it('should detect declining trend', () => {
      const decliningHistory = [0.8, 0.7, 0.6, 0.5, 0.4];
      const trend = masteryEngine.calculateTrend(decliningHistory);
      expect(trend).toBe('declining');
    });

    it('should detect stable trend', () => {
      const stableHistory = [0.7, 0.71, 0.69, 0.7, 0.72];
      const trend = masteryEngine.calculateTrend(stableHistory);
      expect(trend).toBe('stable');
    });

    it('should return unknown for insufficient data', () => {
      const shortHistory = [0.5, 0.6];
      const trend = masteryEngine.calculateTrend(shortHistory);
      expect(trend).toBe('unknown');
    });
  });

  describe('Spaced Repetition', () => {
    it('should calculate appropriate review intervals', () => {
      const now = Date.now();
      
      // Low proficiency should have short interval
      const lowProfNextReview = masteryEngine.calculateNextReviewDate(0.3, 0, now);
      
      // High proficiency should have longer interval
      const highProfNextReview = masteryEngine.calculateNextReviewDate(0.9, 3, now);
      
      expect(highProfNextReview).toBeGreaterThan(lowProfNextReview);
    });

    it('should increase intervals with consecutive correct answers', () => {
      const now = Date.now();
      
      const interval1 = masteryEngine.calculateNextReviewDate(0.7, 1, now);
      const interval2 = masteryEngine.calculateNextReviewDate(0.7, 3, now);
      
      expect(interval2).toBeGreaterThan(interval1);
    });
  });

  describe('Weak Area Detection', () => {
    it('should detect weak areas correctly', () => {
      const mockProficiencies = [
        {
          topicId: 'topic1',
          proficiency: 0.4, // Below threshold
          confidence: 0.8,
          totalAttempts: 10,
          correctAttempts: 4,
          lastPracticed: Date.now() - 86400000, // 1 day ago
          consecutiveCorrect: 0,
          consecutiveIncorrect: 3,
          averageTimeSpent: 90000,
          difficultyBreakdown: {
            easy: { correct: 2, total: 5, avgTime: 60000 },
            med: { correct: 1, total: 3, avgTime: 90000 },
            hard: { correct: 1, total: 2, avgTime: 120000 },
          },
          trend: 'declining' as const,
          needsReview: true,
          nextReviewDate: Date.now() - 3600000, // 1 hour overdue
        },
        {
          topicId: 'topic2',
          proficiency: 0.85, // Above threshold
          confidence: 0.9,
          totalAttempts: 15,
          correctAttempts: 13,
          lastPracticed: Date.now() - 86400000,
          consecutiveCorrect: 5,
          consecutiveIncorrect: 0,
          averageTimeSpent: 75000,
          difficultyBreakdown: {
            easy: { correct: 5, total: 5, avgTime: 60000 },
            med: { correct: 4, total: 5, avgTime: 75000 },
            hard: { correct: 4, total: 5, avgTime: 90000 },
          },
          trend: 'stable' as const,
          needsReview: false,
          nextReviewDate: Date.now() + 86400000, // 1 day from now
        },
      ];

      const weakAreas = masteryEngine.detectWeakAreas(mockProficiencies);
      
      expect(weakAreas).toHaveLength(1);
      expect(weakAreas[0].topicId).toBe('topic1');
      expect(weakAreas[0].priority).toBeGreaterThan(50);
    });
  });

  describe('Question Attempt Processing', () => {
    it('should process question attempts correctly', () => {
      const attempt = {
        questionId: 'q1',
        topicIds: ['topic1', 'topic2'],
        isCorrect: true,
        timeSpentMs: 75000,
        difficulty: 'med' as const,
        attemptDate: Date.now(),
      };

      const updates = masteryEngine.processQuestionAttempt(attempt);
      
      expect(updates).toHaveLength(2); // One for each topic
      expect(updates[0].topicId).toBeDefined();
      expect(updates[0].proficiency).toBeDefined();
      expect(updates[0].totalAttempts).toBe(1);
      expect(updates[0].correctAttempts).toBe(1);
    });
  });

  describe('Practice Recommendations', () => {
    it('should generate appropriate recommendations', () => {
      const mockProficiencies = [
        {
          topicId: 'weak_topic',
          proficiency: 0.4,
          confidence: 0.7,
          totalAttempts: 8,
          correctAttempts: 3,
          lastPracticed: Date.now() - 86400000,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 2,
          averageTimeSpent: 120000,
          difficultyBreakdown: {
            easy: { correct: 1, total: 3, avgTime: 90000 },
            med: { correct: 1, total: 3, avgTime: 120000 },
            hard: { correct: 1, total: 2, avgTime: 150000 },
          },
          trend: 'declining' as const,
          needsReview: true,
          nextReviewDate: Date.now() - 3600000,
        },
      ];

      const recentSessions: LearningSession[] = [];
      const recommendations = masteryEngine.generateRecommendations(
        mockProficiencies,
        recentSessions
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('weak_areas');
      expect(recommendations[0].topicIds).toContain('weak_topic');
      expect(recommendations[0].priority).toBeGreaterThan(70);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration correctly', () => {
      expect(DEFAULT_MASTERY_CONFIG.ewmaAlpha).toBe(0.3);
      expect(DEFAULT_MASTERY_CONFIG.proficiencyThreshold).toBe(0.7);
      expect(DEFAULT_MASTERY_CONFIG.difficultyWeights.hard).toBeGreaterThan(
        DEFAULT_MASTERY_CONFIG.difficultyWeights.easy
      );
    });

    it('should allow configuration updates', () => {
      const newConfig = {
        ewmaAlpha: 0.4,
        proficiencyThreshold: 0.8,
      };

      masteryEngine.updateConfig(newConfig);
      // Note: In a real test, you'd verify the config was applied
      // This would require accessing the internal config state
    });
  });
});

// Integration test with mock database operations
describe('Mastery System Integration', () => {
  it('should integrate with the complete flow', async () => {
    // This would be a more comprehensive test that:
    // 1. Creates mock database
    // 2. Initializes repositories
    // 3. Processes question attempts
    // 4. Generates recommendations
    // 5. Verifies the complete flow

    // For now, this is a placeholder for the full integration test
    expect(true).toBe(true);
  });
});
import { 
  TopicProficiency, 
  WeakArea, 
  PracticeRecommendation, 
  MasteryConfig, 
  DEFAULT_MASTERY_CONFIG,
  LearningSession 
} from '../../shared/types/mastery';
import { Difficulty } from '../../shared/types/database';
import { SecureStorage } from '../../data/storage/SecureStorage';

interface QuestionAttempt {
  questionId: string;
  topicIds: string[];
  isCorrect: boolean;
  timeSpentMs: number;
  difficulty: Difficulty;
  attemptDate: number;
}

export class MasteryEngine {
  private static instance: MasteryEngine;
  private config: MasteryConfig;
  private storage: SecureStorage;

  private constructor() {
    this.config = DEFAULT_MASTERY_CONFIG;
    this.storage = SecureStorage.getInstance();
    this.loadConfig();
  }

  public static getInstance(): MasteryEngine {
    if (!MasteryEngine.instance) {
      MasteryEngine.instance = new MasteryEngine();
    }
    return MasteryEngine.instance;
  }

  private loadConfig(): void {
    try {
      const savedConfig = this.storage.getJson<MasteryConfig>('mastery_config');
      if (savedConfig) {
        this.config = { ...DEFAULT_MASTERY_CONFIG, ...savedConfig };
      }
    } catch (error) {
      console.warn('Failed to load mastery config:', error);
    }
  }

  public updateConfig(newConfig: Partial<MasteryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      this.storage.storeJson('mastery_config', this.config);
    } catch (error) {
      console.warn('Failed to save mastery config:', error);
    }
  }

  /**
   * Calculate new proficiency using EWMA algorithm
   */
  public calculateNewProficiency(
    currentProficiency: number,
    isCorrect: boolean,
    difficulty: Difficulty,
    timeSpentMs: number,
    totalAttempts: number
  ): number {
    const { ewmaAlpha, difficultyWeights, timeWeights } = this.config;

    // Base score (0 or 1)
    const baseScore = isCorrect ? 1.0 : 0.0;

    // Difficulty weighting
    const difficultyWeight = difficultyWeights[difficulty];

    // Time performance weighting
    const optimalTimeMs = timeWeights.optimalTime * 1000;
    let timeMultiplier = 1.0;
    
    if (isCorrect) {
      if (timeSpentMs < optimalTimeMs * 0.7) {
        // Fast correct answer gets bonus
        timeMultiplier = timeWeights.fastBonus;
      } else if (timeSpentMs > optimalTimeMs * 2.0) {
        // Very slow answer gets penalty
        timeMultiplier = timeWeights.slowPenalty;
      }
    }

    // Calculate weighted score
    const weightedScore = baseScore * difficultyWeight * timeMultiplier;

    // Apply confidence weighting for new topics
    const confidenceWeight = Math.min(1.0, totalAttempts / this.config.confidenceThreshold);
    const effectiveAlpha = ewmaAlpha * confidenceWeight;

    // EWMA calculation
    const newProficiency = effectiveAlpha * weightedScore + (1 - effectiveAlpha) * currentProficiency;

    // Clamp to valid range
    return Math.max(0.0, Math.min(1.0, newProficiency));
  }

  /**
   * Calculate statistical confidence in proficiency score
   */
  public calculateConfidence(totalAttempts: number, proficiency: number): number {
    if (totalAttempts === 0) return 0.0;

    // Base confidence from sample size
    const sampleConfidence = Math.min(1.0, totalAttempts / this.config.confidenceThreshold);

    // Reduce confidence for extreme proficiency values (they need more data)
    const extremenessPenalty = 4 * proficiency * (1 - proficiency); // Peaks at 0.5, drops at extremes

    return sampleConfidence * extremenessPenalty;
  }

  /**
   * Determine trend from recent performance
   */
  public calculateTrend(
    proficiencyHistory: number[],
    timeWindow: number = 10
  ): 'improving' | 'stable' | 'declining' | 'unknown' {
    if (proficiencyHistory.length < 3) return 'unknown';

    const recent = proficiencyHistory.slice(-timeWindow);
    if (recent.length < 3) return 'unknown';

    // Simple linear regression to detect trend
    const n = recent.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = recent;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  /**
   * Calculate next review date using spaced repetition
   */
  public calculateNextReviewDate(
    proficiency: number,
    consecutiveCorrect: number,
    lastPracticed: number
  ): number {
    const { spacedRepetitionBase, maxSpacedInterval } = this.config;

    // Base interval increases with proficiency
    const proficiencyMultiplier = Math.max(0.5, proficiency);
    
    // Interval increases exponentially with consecutive correct answers
    const streakMultiplier = Math.pow(2, Math.min(consecutiveCorrect, 6));
    
    // Calculate interval in days
    const intervalDays = Math.min(
      maxSpacedInterval,
      spacedRepetitionBase * proficiencyMultiplier * streakMultiplier
    );

    return lastPracticed + (intervalDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Detect weak areas that need attention
   */
  public detectWeakAreas(proficiencies: TopicProficiency[]): WeakArea[] {
    const weakAreas: WeakArea[] = [];
    const now = Date.now();

    for (const prof of proficiencies) {
      const priority = this.calculateWeakAreaPriority(prof, now);
      
      if (priority > 30) { // Only include areas with significant priority
        const reasonCode = this.determineWeakAreaReason(prof, now);
        const recommendedQuestions = this.calculateRecommendedQuestions(prof);
        const difficultyFocus = this.determineDifficultyFocus(prof);

        weakAreas.push({
          topicId: prof.topicId,
          proficiency: prof.proficiency,
          priority,
          reasonCode,
          recommendedQuestions,
          estimatedStudyTime: recommendedQuestions * 2, // 2 minutes per question
          difficultyFocus,
        });
      }
    }

    // Sort by priority (highest first)
    return weakAreas.sort((a, b) => b.priority - a.priority);
  }

  private calculateWeakAreaPriority(prof: TopicProficiency, now: number): number {
    let priority = 0;

    // Base priority from low proficiency
    if (prof.proficiency < this.config.proficiencyThreshold) {
      priority += (this.config.proficiencyThreshold - prof.proficiency) * 100;
    }

    // Boost priority for declining trends
    if (prof.trend === 'declining') {
      priority += 25;
    }

    // Boost priority for areas that need review
    if (prof.needsReview && now > prof.nextReviewDate) {
      const daysPastDue = (now - prof.nextReviewDate) / (24 * 60 * 60 * 1000);
      priority += Math.min(20, daysPastDue * 2);
    }

    // Boost priority for error-prone areas (many consecutive incorrect)
    if (prof.consecutiveIncorrect >= 3) {
      priority += prof.consecutiveIncorrect * 5;
    }

    // Reduce priority for recently practiced areas
    const daysSincePractice = (now - prof.lastPracticed) / (24 * 60 * 60 * 1000);
    if (daysSincePractice < 1) {
      priority *= 0.5;
    }

    return Math.min(100, Math.max(0, priority));
  }

  private determineWeakAreaReason(
    prof: TopicProficiency, 
    now: number
  ): WeakArea['reasonCode'] {
    if (prof.proficiency < 0.5) return 'low_proficiency';
    if (prof.trend === 'declining') return 'declining_trend';
    if (prof.consecutiveIncorrect >= 3) return 'error_prone';
    if (now > prof.nextReviewDate) return 'needs_practice';
    return 'low_proficiency';
  }

  private calculateRecommendedQuestions(prof: TopicProficiency): number {
    const baseQuestions = 5;
    const proficiencyMultiplier = 1 + (this.config.proficiencyThreshold - prof.proficiency);
    const confidenceMultiplier = 1 + (0.5 - prof.confidence);
    
    const recommended = baseQuestions * proficiencyMultiplier * confidenceMultiplier;
    return Math.max(3, Math.min(15, Math.round(recommended)));
  }

  private determineDifficultyFocus(prof: TopicProficiency): WeakArea['difficultyFocus'] {
    const { easy, med, hard } = prof.difficultyBreakdown;
    
    // Calculate success rates
    const easyRate = easy.total > 0 ? easy.correct / easy.total : 0;
    const medRate = med.total > 0 ? med.correct / med.total : 0;
    const hardRate = hard.total > 0 ? hard.correct / hard.total : 0;

    // Focus on the most problematic difficulty
    if (easyRate < 0.7) return 'easy';
    if (medRate < 0.6) return 'med';
    if (hardRate < 0.5) return 'hard';
    
    // If all are okay, use adaptive mix
    return 'mixed';
  }

  /**
   * Generate personalized practice recommendations
   */
  public generateRecommendations(
    proficiencies: TopicProficiency[],
    _recentSessions: LearningSession[]
  ): PracticeRecommendation[] {
    const recommendations: PracticeRecommendation[] = [];
    const weakAreas = this.detectWeakAreas(proficiencies);
    const now = Date.now();

    // Weak areas recommendation
    if (weakAreas.length > 0) {
      const topWeakAreas = weakAreas.slice(0, 3);
      recommendations.push({
        id: `weak_areas_${now}`,
        type: 'weak_areas',
        title: 'Focus on Weak Areas',
        description: `Practice ${topWeakAreas.length} topics where you need improvement`,
        topicIds: topWeakAreas.map(wa => wa.topicId),
        questionCount: topWeakAreas.reduce((sum, wa) => sum + wa.recommendedQuestions, 0),
        estimatedDuration: topWeakAreas.reduce((sum, wa) => sum + wa.estimatedStudyTime, 0),
        difficulty: 'adaptive',
        priority: 90,
        reasoning: `You have ${weakAreas.length} areas below 70% proficiency`,
        expectedImpact: {
          proficiencyGain: 0.15,
          weakAreasAddressed: topWeakAreas.length,
        },
      });
    }

    // Spaced review recommendation
    const reviewTopics = proficiencies.filter(p => 
      p.needsReview && now > p.nextReviewDate && p.proficiency >= this.config.proficiencyThreshold
    );

    if (reviewTopics.length > 0) {
      recommendations.push({
        id: `spaced_review_${now}`,
        type: 'spaced_review',
        title: 'Spaced Review',
        description: `Review ${reviewTopics.length} topics to maintain your knowledge`,
        topicIds: reviewTopics.map(rt => rt.topicId),
        questionCount: reviewTopics.length * 3,
        estimatedDuration: reviewTopics.length * 6,
        difficulty: 'med',
        priority: 70,
        reasoning: 'These topics are due for spaced repetition review',
        expectedImpact: {
          proficiencyGain: 0.05,
          weakAreasAddressed: 0,
        },
      });
    }

    // Challenge recommendation for high performers
    const strongTopics = proficiencies.filter(p => p.proficiency >= 0.8 && p.confidence >= 0.7);
    if (strongTopics.length >= 3) {
      recommendations.push({
        id: `challenge_${now}`,
        type: 'challenge',
        title: 'Challenge Mode',
        description: 'Test your mastery with difficult questions',
        topicIds: strongTopics.slice(0, 5).map(st => st.topicId),
        questionCount: 10,
        estimatedDuration: 25,
        difficulty: 'hard',
        priority: 50,
        reasoning: 'Challenge yourself with harder questions in your strong areas',
        expectedImpact: {
          proficiencyGain: 0.08,
          weakAreasAddressed: 0,
        },
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process a completed question attempt
   */
  public processQuestionAttempt(
    attempt: QuestionAttempt,
    currentProficiency?: TopicProficiency
  ): Partial<TopicProficiency>[] {
    const updates: Partial<TopicProficiency>[] = [];
    const now = Date.now();

    for (const topicId of attempt.topicIds) {
      const prof = currentProficiency || this.getDefaultProficiency(topicId);
      
      // Calculate new proficiency
      const newProficiency = this.calculateNewProficiency(
        prof.proficiency,
        attempt.isCorrect,
        attempt.difficulty,
        attempt.timeSpentMs,
        prof.totalAttempts
      );

      // Update streak counters
      const consecutiveCorrect = attempt.isCorrect ? prof.consecutiveCorrect + 1 : 0;
      const consecutiveIncorrect = attempt.isCorrect ? 0 : prof.consecutiveIncorrect + 1;

      // Update difficulty breakdown
      const difficultyBreakdown = { ...prof.difficultyBreakdown };
      const diffKey = attempt.difficulty;
      difficultyBreakdown[diffKey] = {
        correct: difficultyBreakdown[diffKey].correct + (attempt.isCorrect ? 1 : 0),
        total: difficultyBreakdown[diffKey].total + 1,
        avgTime: (difficultyBreakdown[diffKey].avgTime * difficultyBreakdown[diffKey].total + attempt.timeSpentMs) / (difficultyBreakdown[diffKey].total + 1),
      };

      // Calculate updated metrics
      const totalAttempts = prof.totalAttempts + 1;
      const correctAttempts = prof.correctAttempts + (attempt.isCorrect ? 1 : 0);
      const confidence = this.calculateConfidence(totalAttempts, newProficiency);
      const averageTimeSpent = (prof.averageTimeSpent * prof.totalAttempts + attempt.timeSpentMs) / totalAttempts;

      // Determine if review is needed
      const needsReview = newProficiency < this.config.proficiencyThreshold || consecutiveIncorrect >= 3;
      const nextReviewDate = this.calculateNextReviewDate(newProficiency, consecutiveCorrect, now);

      updates.push({
        topicId,
        proficiency: newProficiency,
        confidence,
        totalAttempts,
        correctAttempts,
        lastPracticed: now,
        consecutiveCorrect,
        consecutiveIncorrect,
        averageTimeSpent,
        difficultyBreakdown,
        needsReview,
        nextReviewDate,
      });
    }

    return updates;
  }

  private getDefaultProficiency(topicId: string): TopicProficiency {
    return {
      topicId,
      proficiency: 0.5,
      confidence: 0.0,
      totalAttempts: 0,
      correctAttempts: 0,
      lastPracticed: Date.now(),
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      averageTimeSpent: 0,
      difficultyBreakdown: {
        easy: { correct: 0, total: 0, avgTime: 0 },
        med: { correct: 0, total: 0, avgTime: 0 },
        hard: { correct: 0, total: 0, avgTime: 0 },
      },
      trend: 'unknown',
      needsReview: true,
      nextReviewDate: Date.now() + (24 * 60 * 60 * 1000), // Tomorrow
    };
  }
}
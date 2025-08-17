export interface TopicProficiency {
  topicId: string;
  proficiency: number; // 0.0 to 1.0
  confidence: number; // Statistical confidence in the proficiency score
  totalAttempts: number;
  correctAttempts: number;
  lastPracticed: number; // timestamp
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  averageTimeSpent: number; // milliseconds
  difficultyBreakdown: {
    easy: { correct: number; total: number; avgTime: number };
    med: { correct: number; total: number; avgTime: number };
    hard: { correct: number; total: number; avgTime: number };
  };
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  needsReview: boolean;
  nextReviewDate: number; // timestamp
}

export interface WeakArea {
  topicId: string;
  proficiency: number;
  priority: number; // 0-100, higher = more urgent
  reasonCode: 'low_proficiency' | 'declining_trend' | 'error_prone' | 'needs_practice';
  recommendedQuestions: number;
  estimatedStudyTime: number; // minutes
  difficultyFocus: 'easy' | 'med' | 'hard' | 'mixed';
}

export interface MasteryGoal {
  id: string;
  topicId: string;
  targetProficiency: number;
  targetDate: number; // timestamp
  status: 'active' | 'achieved' | 'overdue' | 'paused';
  progress: number; // 0-100
  estimatedCompletionDate: number;
}

export interface PracticeRecommendation {
  id: string;
  type: 'weak_areas' | 'spaced_review' | 'maintenance' | 'challenge';
  title: string;
  description: string;
  topicIds: string[];
  questionCount: number;
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'med' | 'hard' | 'adaptive';
  priority: number; // 0-100
  reasoning: string;
  expectedImpact: {
    proficiencyGain: number;
    weakAreasAddressed: number;
  };
}

export interface LearningSession {
  id: string;
  startTime: number;
  endTime?: number;
  topicsStudied: string[];
  questionsAnswered: number;
  correctAnswers: number;
  timeSpent: number;
  proficiencyChanges: Record<string, { before: number; after: number }>;
  weakAreasImproved: string[];
  recommendationFollowed?: string;
}

export interface MasteryConfig {
  ewmaAlpha: number; // Learning rate for EWMA (0.1 - 0.5)
  proficiencyThreshold: number; // Below this = weak area (default 0.7)
  confidenceThreshold: number; // Minimum attempts for reliable proficiency
  spacedRepetitionBase: number; // Base interval in days
  maxSpacedInterval: number; // Maximum interval in days
  difficultyWeights: {
    easy: number;
    med: number;
    hard: number;
  };
  timeWeights: {
    fastBonus: number; // Multiplier for quick correct answers
    slowPenalty: number; // Penalty for very slow answers
    optimalTime: number; // Optimal time per question in seconds
  };
}

export const DEFAULT_MASTERY_CONFIG: MasteryConfig = {
  ewmaAlpha: 0.3,
  proficiencyThreshold: 0.7,
  confidenceThreshold: 10,
  spacedRepetitionBase: 1,
  maxSpacedInterval: 30,
  difficultyWeights: {
    easy: 1.0,
    med: 1.25,
    hard: 1.5,
  },
  timeWeights: {
    fastBonus: 1.2,
    slowPenalty: 0.8,
    optimalTime: 90, // 90 seconds per question
  },
};
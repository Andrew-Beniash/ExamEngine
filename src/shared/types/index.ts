// Database types
export type {
  Question,
  Choice,
  ExamTemplate,
  ExamSection,
  Difficulty,
  QuestionType,
  Attempt,
  AttemptItem,
  Tip,
  Pack,
  PerTopicStats,
} from './database';

// Content pack types
export type {
  PackManifest,
  QuestionPackItem,
  ExamTemplatePackItem,
  TipPackItem,
  PackValidationResult,
} from './contentPack';

// Additional content pack types (if needed)
export type PackStatus = 'active' | 'disabled' | 'updating' | 'installing' | 'failed';
export type PackMetadata = {
  totalQuestions: number;
  totalTips: number;
  totalTemplates: number;
  topics: string[];
  supportedLanguages: string[];
};

// Mastery types
export type {
  TopicProficiency,
  WeakArea,
  PracticeRecommendation,
  LearningSession,
  MasteryGoal,
  MasteryConfig,
} from './mastery';

// Common re-exports
export { DEFAULT_MASTERY_CONFIG } from './mastery';
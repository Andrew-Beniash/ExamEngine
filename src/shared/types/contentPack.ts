export interface PackManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  minAppVersion: string;
  maxAppVersion?: string;
  checksum: string;
  signature: string;
  createdAt: number;
  files: {
    questions: string;
    examTemplates: string;
    tips: string;
    media?: string[];
  };
  metadata?: {
    totalQuestions: number;
    totalTips: number;
    totalTemplates: number;
    topics: string[];
    supportedLanguages: string[];
  };
}

export interface QuestionPackItem {
  id: string;
  type: 'single' | 'multi' | 'scenario' | 'order';
  stem: string;
  topicIds: string[];
  choices?: Array<{
    id: string;
    text: string;
  }>;
  correct?: string[];
  correctOrder?: string[];
  exhibits?: string[];
  difficulty: 'easy' | 'med' | 'hard';
  explanation?: string;
}

export interface ExamTemplatePackItem {
  id: string;
  name: string;
  durationMinutes: number;
  sections: Array<{
    topicIds: string[];
    count: number;
    difficultyMix?: {
      easy: number;
      med: number;
      hard: number;
    };
  }>;
  calculatorRules?: Record<string, unknown>;
}

export interface TipPackItem {
  id: string;
  topicIds: string[];
  title: string;
  body: string;
  tags?: string[];
  relatedQuestionIds?: string[];
}

export interface PackValidationResult {
  isValid: boolean;
  errors: Array<{
    file: string;
    field?: string;
    message: string;
    line?: number;
  }>;
  warnings: Array<{
    file: string;
    field?: string;
    message: string;
    line?: number;
  }>;
}

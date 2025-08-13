export type QuestionType = 'single' | 'multi' | 'scenario' | 'order';
export type Difficulty = 'easy' | 'med' | 'hard';
export type PackStatus = 'active' | 'disabled' | 'updating';

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  topicIds: string[];
  choices?: Choice[];
  correct?: string[];
  correctOrder?: string[];
  exhibits?: string[];
  difficulty: Difficulty;
  explanation?: string;
  packId: string;
}

export interface ExamSection {
  topicIds: string[];
  count: number;
  difficultyMix?: {
    easy: number;
    med: number;
    hard: number;
  };
}

export interface ExamTemplate {
  id: string;
  name: string;
  durationMinutes: number;
  sections: ExamSection[];
  calculatorRules?: Record<string, unknown>;
  packId: string;
}

export interface Attempt {
  id: string;
  templateId?: string;
  packId: string;
  startedAt: number;
  endedAt?: number;
  score?: number;
  summary?: PerTopicStats;
  deviceGuid: string;
}

export interface AttemptItem {
  attemptId: string;
  questionId: string;
  given?: string[];
  correct: boolean;
  timeSpentMs: number;
}

export interface Tip {
  id: string;
  topicIds: string[];
  title: string;
  body: string;
  packId: string;
}

export interface Pack {
  id: string;
  version: string;
  sha256: string;
  signature: string;
  installedAt: number;
  status: PackStatus;
}

export interface PerTopicStats {
  [topicId: string]: {
    correct: number;
    total: number;
    proficiency?: number;
  };
}

import { Question, Difficulty } from '../../shared/types/database';

export interface QuestionSamplingParams {
  topicIds: string[];
  difficulty?: Difficulty[];
  packId?: string;
  excludeIds?: string[];
  limit: number;
}

export interface IQuestionRepository {
  getById(id: string): Promise<Question | null>;
  getByIds(ids: string[]): Promise<Question[]>;
  sampleQuestions(params: QuestionSamplingParams): Promise<Question[]>;
  getByTopics(topicIds: string[], packId?: string): Promise<Question[]>;
  create(question: Question): Promise<void>;
  createMany(questions: Question[]): Promise<void>;
  update(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByPackId(packId: string): Promise<void>;
}

export interface IAttemptRepository {
  startAttempt(sessionId: string, templateId: string | null, packId: string): Promise<void>;
  recordAnswer(
    attemptId: string,
    questionId: string,
    selectedIds: string[],
    timeSpentMs: number,
    isCorrect: boolean
  ): Promise<void>;
  finalizeAttempt(
    attemptId: string,
    score: number,
    summary: any
  ): Promise<void>;
  getById(id: string): Promise<any>;
  getByDeviceGuid(deviceGuid: string, limit?: number): Promise<any[]>;
  getRecentAttempts(limit?: number): Promise<any[]>;
  deleteAttempt(id: string): Promise<void>;
}
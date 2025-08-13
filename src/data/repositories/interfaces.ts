import { Question, Attempt, AttemptItem, Tip, Pack, PerTopicStats, Difficulty } from '../../shared/types/database';

export interface QuestionSamplingParams {
  topicIds: string[];
  difficulty?: Difficulty[];
  limit: number;
  excludeIds?: string[];
  packId?: string;
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
  getById(id: string): Promise<Attempt | null>;
  startAttempt(templateId: string | undefined, packId: string, deviceGuid: string): Promise<string>;
  recordAnswer(
    attemptId: string,
    questionId: string,
    selectedIds: string[],
    timeSpentMs: number
  ): Promise<void>;
  finalizeAttempt(attemptId: string): Promise<{
    score: number;
    perTopicStats: PerTopicStats;
  }>;
  getAttemptItems(attemptId: string): Promise<AttemptItem[]>;
  getRecentAttempts(deviceGuid: string, limit?: number): Promise<Attempt[]>;
  updateAttempt(attempt: Attempt): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ITipRepository {
  getById(id: string): Promise<Tip | null>;
  getByTopics(topicIds: string[], packId?: string): Promise<Tip[]>;
  search(query: string, topicIds?: string[]): Promise<Tip[]>;
  create(tip: Tip): Promise<void>;
  createMany(tips: Tip[]): Promise<void>;
  update(tip: Tip): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByPackId(packId: string): Promise<void>;
}

export interface IPackRepository {
  getById(id: string): Promise<Pack | null>;
  getAll(): Promise<Pack[]>;
  getActive(): Promise<Pack[]>;
  create(pack: Pack): Promise<void>;
  update(pack: Pack): Promise<void>;
  updateStatus(id: string, status: Pack['status']): Promise<void>;
  delete(id: string): Promise<void>;
  isInstalled(id: string, version: string): Promise<boolean>;
}

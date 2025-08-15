import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { QuestionRepository } from './QuestionRepository';
import { AttemptRepository } from './AttemptRepository';
import { SQLiteTipRepository, TipRepository } from './TipRepository';
import { IQuestionRepository, IAttemptRepository } from './interfaces';

export class RepositoryFactory {
  private static questionRepository: IQuestionRepository;
  private static attemptRepository: IAttemptRepository;
  private static tipRepository: TipRepository;

  static initializeRepositories(db: QuickSQLiteConnection): void {
    this.questionRepository = new QuestionRepository(db);
    this.attemptRepository = new AttemptRepository(db);
    this.tipRepository = new SQLiteTipRepository(db);
  }

  static getQuestionRepository(): IQuestionRepository {
    if (!this.questionRepository) {
      throw new Error('Repositories not initialized. Call initializeRepositories first.');
    }
    return this.questionRepository;
  }

  static getAttemptRepository(): IAttemptRepository {
    if (!this.attemptRepository) {
      throw new Error('Repositories not initialized. Call initializeRepositories first.');
    }
    return this.attemptRepository;
  }

  static getTipRepository(): TipRepository {
    if (!this.tipRepository) {
      throw new Error('Repositories not initialized. Call initializeRepositories first.');
    }
    return this.tipRepository;
  }
}
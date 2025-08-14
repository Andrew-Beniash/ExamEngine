import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { QuestionRepository } from './QuestionRepository';
import { AttemptRepository } from './AttemptRepository';
import { IQuestionRepository, IAttemptRepository } from './interfaces';

export class RepositoryFactory {
  private static questionRepository: IQuestionRepository;
  private static attemptRepository: IAttemptRepository;

  static initializeRepositories(db: QuickSQLiteConnection): void {
    this.questionRepository = new QuestionRepository(db);
    this.attemptRepository = new AttemptRepository(db);
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
}
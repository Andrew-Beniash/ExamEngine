import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { QuestionRepository } from './QuestionRepository';
import { AttemptRepository } from './AttemptRepository';
import { IQuestionRepository, IAttemptRepository } from './interfaces';

export class RepositoryFactory {
  private static questionRepo: IQuestionRepository | null = null;
  private static attemptRepo: IAttemptRepository | null = null;

  static initializeRepositories(db: QuickSQLiteConnection): void {
    this.questionRepo = new QuestionRepository(db);
    this.attemptRepo = new AttemptRepository(db);
  }

  static getQuestionRepository(): IQuestionRepository {
    if (!this.questionRepo) {
      throw new Error('Repositories not initialized. Call initializeRepositories first.');
    }
    return this.questionRepo;
  }

  static getAttemptRepository(): IAttemptRepository {
    if (!this.attemptRepo) {
      throw new Error('Repositories not initialized. Call initializeRepositories first.');
    }
    return this.attemptRepo;
  }
}

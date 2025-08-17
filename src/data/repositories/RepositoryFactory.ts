import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { QuestionRepository } from './QuestionRepository';
import { AttemptRepository } from './AttemptRepository';
import { SQLiteTipRepository } from './TipRepository';
import { UserPreferencesRepository } from './UserPreferencesRepository';
import { MasteryRepository } from './MasteryRepository';

export class RepositoryFactory {
  private static questionRepository: QuestionRepository | null = null;
  private static attemptRepository: AttemptRepository | null = null;
  private static tipRepository: SQLiteTipRepository | null = null;
  private static masteryRepository: MasteryRepository | null = null;
  private static database: QuickSQLiteConnection | null = null;

  public static initializeRepositories(database: QuickSQLiteConnection): void {
    this.database = database;
    
    // Initialize repositories that use database
    this.questionRepository = new QuestionRepository(database);
    this.attemptRepository = new AttemptRepository(database);
    this.tipRepository = new SQLiteTipRepository(database);
    this.masteryRepository = new MasteryRepository(database);
    
    // UserPreferencesRepository is static and doesn't need initialization
    
    console.log('All repositories initialized successfully');
  }

  public static getQuestionRepository(): QuestionRepository {
    if (!this.questionRepository) {
      throw new Error('QuestionRepository not initialized. Call initializeRepositories first.');
    }
    return this.questionRepository;
  }

  public static getAttemptRepository(): AttemptRepository {
    if (!this.attemptRepository) {
      throw new Error('AttemptRepository not initialized. Call initializeRepositories first.');
    }
    return this.attemptRepository;
  }

  public static getTipRepository(): SQLiteTipRepository {
    if (!this.tipRepository) {
      throw new Error('TipRepository not initialized. Call initializeRepositories first.');
    }
    return this.tipRepository;
  }

  public static getUserPreferencesRepository(): typeof UserPreferencesRepository {
    // UserPreferencesRepository is a static class, so return the class itself
    return UserPreferencesRepository;
  }

  public static getMasteryRepository(): MasteryRepository {
    if (!this.masteryRepository) {
      throw new Error('MasteryRepository not initialized. Call initializeRepositories first.');
    }
    return this.masteryRepository;
  }

  public static getDatabase(): QuickSQLiteConnection {
    if (!this.database) {
      throw new Error('Database not initialized. Call initializeRepositories first.');
    }
    return this.database;
  }

  public static resetRepositories(): void {
    this.questionRepository = null;
    this.attemptRepository = null;
    this.tipRepository = null;
    this.masteryRepository = null;
    this.database = null;
    console.log('All repositories reset');
  }

  // Utility method to check if repositories are initialized
  public static isInitialized(): boolean {
    return this.database !== null && 
           this.questionRepository !== null && 
           this.attemptRepository !== null && 
           this.tipRepository !== null && 
           this.masteryRepository !== null;
  }

  // Method to get all repository instances (useful for testing)
  public static getAllRepositories() {
    return {
      questionRepository: this.questionRepository,
      attemptRepository: this.attemptRepository,
      tipRepository: this.tipRepository,
      userPreferencesRepository: UserPreferencesRepository,
      masteryRepository: this.masteryRepository,
    };
  }
}
import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { DATABASE_NAME, CREATE_TABLES, CREATE_INDEXES, DATABASE_VERSION } from './schema';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: QuickSQLiteConnection | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = open({ name: DATABASE_NAME });
      await this.runMigrations();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create user_version table if it doesn't exist
    this.db.execute('PRAGMA user_version;');
    const result = this.db.execute('PRAGMA user_version;');
    const currentVersion = result.rows?._array[0]?.user_version || 0;

    if (currentVersion < DATABASE_VERSION) {
      console.log(`Running migrations from version ${currentVersion} to ${DATABASE_VERSION}`);
      
      // Create tables
      for (const createTable of CREATE_TABLES) {
        this.db.execute(createTable);
      }

      // Create indexes
      for (const createIndex of CREATE_INDEXES) {
        this.db.execute(createIndex);
      }

      // Update version
      this.db.execute(`PRAGMA user_version = ${DATABASE_VERSION};`);
      
      console.log('Migrations completed successfully');
    }
  }

  getDatabase(): QuickSQLiteConnection {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async reset(): Promise<void> {
    if (!this.db) return;
    
    // Drop all tables
    const tables = ['question', 'exam_template', 'attempt', 'attempt_item', 'tip', 'pack'];
    for (const table of tables) {
      this.db.execute(`DROP TABLE IF EXISTS ${table};`);
    }
    
    // Reset version
    this.db.execute('PRAGMA user_version = 0;');
    
    // Re-run migrations
    await this.runMigrations();
    
    console.log('Database reset completed');
  }
}

export default DatabaseManager;

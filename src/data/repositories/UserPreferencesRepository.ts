import { MMKV } from 'react-native-mmkv';

export interface UserPreferences {
  // Privacy Settings
  analyticsOptOut: boolean;
  adPersonalizationOptOut: boolean;
  
  // Accessibility Settings
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrastMode: boolean;
  reduceMotion: boolean;
  
  // App Preferences
  hapticFeedback: boolean;
  soundEffects: boolean;
  pushNotifications: boolean;
  
  // Study Preferences
  practiceReminders: boolean;
  dailyGoalReminders: boolean;
  weeklyProgressReports: boolean;
  
  // Display Preferences
  darkMode: 'auto' | 'light' | 'dark';
  showProgressInTabs: boolean;
  compactMode: boolean;
  
  // Advanced Settings
  cacheLimit: number; // MB
  autoDownloadUpdates: boolean;
  offlineMode: boolean;
}

export interface ProfileStats {
  totalPracticeTime: number; // minutes
  totalQuestionsAnswered: number;
  currentStreak: number; // days
  longestStreak: number; // days
  lastPracticeDate: string; // ISO date
  joinedDate: string; // ISO date
  averageScore: number; // percentage
  totalExamsCompleted: number;
  favoriteTopics: string[]; // topic IDs
  weakestTopics: string[]; // topic IDs
}

export interface TopicProficiency {
  topicId: string;
  proficiency: number; // 0-1 EWMA score
  confidence: number; // 0-1 confidence interval
  lastPracticed: string; // ISO date
  totalQuestions: number;
  correctAnswers: number;
  averageTimePerQuestion: number; // seconds
  improvementTrend: 'improving' | 'stable' | 'declining';
}

const storage = new MMKV();

export class UserPreferencesRepository {
  private static readonly PREFERENCES_KEY = 'user_preferences';
  private static readonly PROFILE_STATS_KEY = 'profile_stats';
  private static readonly TOPIC_PROFICIENCIES_KEY = 'topic_proficiencies';
  private static readonly DEVICE_GUID_KEY = 'device_guid';

  // Default preferences
  private static readonly DEFAULT_PREFERENCES: UserPreferences = {
    analyticsOptOut: false,
    adPersonalizationOptOut: false,
    fontSize: 'medium',
    highContrastMode: false,
    reduceMotion: false,
    hapticFeedback: true,
    soundEffects: true,
    pushNotifications: true,
    practiceReminders: true,
    dailyGoalReminders: true,
    weeklyProgressReports: true,
    darkMode: 'auto',
    showProgressInTabs: true,
    compactMode: false,
    cacheLimit: 500,
    autoDownloadUpdates: true,
    offlineMode: false,
  };

  // User Preferences Methods
  static getPreferences(): UserPreferences {
    try {
      const stored = storage.getString(this.PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new preferences
        return { ...this.DEFAULT_PREFERENCES, ...parsed };
      }
      return this.DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return this.DEFAULT_PREFERENCES;
    }
  }

  static setPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      storage.set(this.PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error setting preferences:', error);
    }
  }

  static updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    this.setPreferences({ [key]: value });
  }

  static resetPreferences(): void {
    try {
      storage.set(this.PREFERENCES_KEY, JSON.stringify(this.DEFAULT_PREFERENCES));
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  }

  // Profile Stats Methods
  static getProfileStats(): ProfileStats {
    try {
      const stored = storage.getString(this.PROFILE_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return default stats for new users
      return {
        totalPracticeTime: 0,
        totalQuestionsAnswered: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
        averageScore: 0,
        totalExamsCompleted: 0,
        favoriteTopics: [],
        weakestTopics: [],
      };
    } catch (error) {
      console.error('Error getting profile stats:', error);
      return {
        totalPracticeTime: 0,
        totalQuestionsAnswered: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
        averageScore: 0,
        totalExamsCompleted: 0,
        favoriteTopics: [],
        weakestTopics: [],
      };
    }
  }

  static updateProfileStats(updates: Partial<ProfileStats>): void {
    try {
      const current = this.getProfileStats();
      const updated = { ...current, ...updates };
      storage.set(this.PROFILE_STATS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating profile stats:', error);
    }
  }

  static recordPracticeSession(
    questionsAnswered: number,
    timeSpent: number,
    score: number
  ): void {
    try {
      const stats = this.getProfileStats();
      const today = new Date().toISOString().split('T')[0];
      const lastPracticeDate = stats.lastPracticeDate.split('T')[0];
      
      // Update streak
      let newStreak = stats.currentStreak;
      if (today === lastPracticeDate) {
        // Same day, don't change streak
      } else if (this.isConsecutiveDay(lastPracticeDate, today)) {
        newStreak = stats.currentStreak + 1;
      } else {
        newStreak = 1; // Reset streak
      }

      const totalQuestions = stats.totalQuestionsAnswered + questionsAnswered;
      const newAverageScore = totalQuestions > 0 
        ? (stats.averageScore * stats.totalQuestionsAnswered + score * questionsAnswered) / totalQuestions
        : score;

      this.updateProfileStats({
        totalPracticeTime: stats.totalPracticeTime + timeSpent,
        totalQuestionsAnswered: totalQuestions,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastPracticeDate: new Date().toISOString(),
        averageScore: newAverageScore,
      });
    } catch (error) {
      console.error('Error recording practice session:', error);
    }
  }

  static recordExamCompletion(): void {
    try {
      const stats = this.getProfileStats();
      this.updateProfileStats({
        totalExamsCompleted: stats.totalExamsCompleted + 1,
      });
    } catch (error) {
      console.error('Error recording exam completion:', error);
    }
  }

  // Topic Proficiencies Methods
  static getTopicProficiencies(): TopicProficiency[] {
    try {
      const stored = storage.getString(this.TOPIC_PROFICIENCIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting topic proficiencies:', error);
      return [];
    }
  }

  static updateTopicProficiency(proficiency: TopicProficiency): void {
    try {
      const proficiencies = this.getTopicProficiencies();
      const index = proficiencies.findIndex(p => p.topicId === proficiency.topicId);
      
      if (index >= 0) {
        proficiencies[index] = proficiency;
      } else {
        proficiencies.push(proficiency);
      }
      
      storage.set(this.TOPIC_PROFICIENCIES_KEY, JSON.stringify(proficiencies));
    } catch (error) {
      console.error('Error updating topic proficiency:', error);
    }
  }

  static getTopicProficiency(topicId: string): TopicProficiency | null {
    const proficiencies = this.getTopicProficiencies();
    return proficiencies.find(p => p.topicId === topicId) || null;
  }

  // Device GUID Methods
  static getDeviceGuid(): string {
    try {
      let guid = storage.getString(this.DEVICE_GUID_KEY);
      if (!guid) {
        guid = this.generateGuid();
        storage.set(this.DEVICE_GUID_KEY, guid);
      }
      return guid;
    } catch (error) {
      console.error('Error getting device GUID:', error);
      return this.generateGuid();
    }
  }

  // Data Export Methods
  static exportUserData(): {
    preferences: UserPreferences;
    profileStats: ProfileStats;
    topicProficiencies: TopicProficiency[];
    deviceGuid: string;
    exportDate: string;
  } {
    return {
      preferences: this.getPreferences(),
      profileStats: this.getProfileStats(),
      topicProficiencies: this.getTopicProficiencies(),
      deviceGuid: this.getDeviceGuid(),
      exportDate: new Date().toISOString(),
    };
  }

  static clearAllData(): void {
    try {
      storage.clearAll();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Helper Methods
  private static generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private static isConsecutiveDay(lastDate: string, currentDate: string): boolean {
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  // App Settings Helpers
  static getFontScale(): number {
    const fontSize = this.getPreferences().fontSize;
    switch (fontSize) {
      case 'small': return 0.85;
      case 'medium': return 1.0;
      case 'large': return 1.15;
      case 'extra-large': return 1.3;
      default: return 1.0;
    }
  }

  static shouldShowMotion(): boolean {
    return !this.getPreferences().reduceMotion;
  }

  static shouldUseHaptics(): boolean {
    return this.getPreferences().hapticFeedback;
  }

  static shouldPlaySounds(): boolean {
    return this.getPreferences().soundEffects;
  }
}
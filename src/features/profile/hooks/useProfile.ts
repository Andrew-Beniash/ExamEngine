import { useState, useCallback, useEffect } from 'react';
import {
  UserPreferencesRepository,
  UserPreferences,
  ProfileStats,
  TopicProficiency,
} from '../../../data/repositories/UserPreferencesRepository';

export interface UseProfileState {
  preferences: UserPreferences;
  profileStats: ProfileStats;
  topicProficiencies: TopicProficiency[];
  isLoading: boolean;
  error: string | null;
}

export interface UseProfileActions {
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  recordPracticeSession: (
    questionsAnswered: number,
    timeSpent: number,
    score: number
  ) => void;
  recordExamCompletion: () => void;
  updateTopicProficiency: (proficiency: TopicProficiency) => void;
  exportUserData: () => Promise<string>;
  clearAllData: () => Promise<void>;
  resetPreferences: () => void;
  refreshData: () => void;
}

export const useProfile = (): UseProfileState & UseProfileActions => {
  const [state, setState] = useState<UseProfileState>({
    preferences: UserPreferencesRepository.getPreferences(),
    profileStats: UserPreferencesRepository.getProfileStats(),
    topicProficiencies: UserPreferencesRepository.getTopicProficiencies(),
    isLoading: false,
    error: null,
  });

  const refreshData = useCallback(() => {
    try {
      setState(prev => ({
        ...prev,
        preferences: UserPreferencesRepository.getPreferences(),
        profileStats: UserPreferencesRepository.getProfileStats(),
        topicProficiencies: UserPreferencesRepository.getTopicProficiencies(),
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing profile data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load profile data',
      }));
    }
  }, []);

  // Refresh data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    try {
      UserPreferencesRepository.updatePreference(key, value);
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
        error: null,
      }));
    } catch (error) {
      console.error('Error updating preference:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update preference',
      }));
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    try {
      UserPreferencesRepository.setPreferences(updates);
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates },
        error: null,
      }));
    } catch (error) {
      console.error('Error updating preferences:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update preferences',
      }));
    }
  }, []);

  const recordPracticeSession = useCallback((
    questionsAnswered: number,
    timeSpent: number,
    score: number
  ) => {
    try {
      UserPreferencesRepository.recordPracticeSession(questionsAnswered, timeSpent, score);
      setState(prev => ({
        ...prev,
        profileStats: UserPreferencesRepository.getProfileStats(),
        error: null,
      }));
    } catch (error) {
      console.error('Error recording practice session:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to record practice session',
      }));
    }
  }, []);

  const recordExamCompletion = useCallback(() => {
    try {
      UserPreferencesRepository.recordExamCompletion();
      setState(prev => ({
        ...prev,
        profileStats: UserPreferencesRepository.getProfileStats(),
        error: null,
      }));
    } catch (error) {
      console.error('Error recording exam completion:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to record exam completion',
      }));
    }
  }, []);

  const updateTopicProficiency = useCallback((proficiency: TopicProficiency) => {
    try {
      UserPreferencesRepository.updateTopicProficiency(proficiency);
      setState(prev => ({
        ...prev,
        topicProficiencies: UserPreferencesRepository.getTopicProficiencies(),
        error: null,
      }));
    } catch (error) {
      console.error('Error updating topic proficiency:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update topic proficiency',
      }));
    }
  }, []);

  const exportUserData = useCallback(async (): Promise<string> => {
    try {
      const userData = UserPreferencesRepository.exportUserData();
      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      UserPreferencesRepository.clearAllData();
      
      setState(prev => ({
        ...prev,
        preferences: UserPreferencesRepository.getPreferences(),
        profileStats: UserPreferencesRepository.getProfileStats(),
        topicProficiencies: UserPreferencesRepository.getTopicProficiencies(),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error clearing data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to clear data',
      }));
    }
  }, []);

  const resetPreferences = useCallback(() => {
    try {
      UserPreferencesRepository.resetPreferences();
      setState(prev => ({
        ...prev,
        preferences: UserPreferencesRepository.getPreferences(),
        error: null,
      }));
    } catch (error) {
      console.error('Error resetting preferences:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to reset preferences',
      }));
    }
  }, []);

  return {
    ...state,
    updatePreference,
    updatePreferences,
    recordPracticeSession,
    recordExamCompletion,
    updateTopicProficiency,
    exportUserData,
    clearAllData,
    resetPreferences,
    refreshData,
  };
};

// Additional utility hooks for specific use cases

export const usePreferences = () => {
  const { preferences, updatePreference, updatePreferences } = useProfile();
  return { preferences, updatePreference, updatePreferences };
};

export const useProfileStats = () => {
  const { profileStats, recordPracticeSession, recordExamCompletion } = useProfile();
  return { profileStats, recordPracticeSession, recordExamCompletion };
};

export const useTopicProficiencies = () => {
  const { topicProficiencies, updateTopicProficiency } = useProfile();
  return { topicProficiencies, updateTopicProficiency };
};

// Utility functions that can be used throughout the app
export const useAppSettings = () => {
  const { preferences } = useProfile();

  return {
    fontScale: UserPreferencesRepository.getFontScale(),
    shouldShowMotion: UserPreferencesRepository.shouldShowMotion(),
    shouldUseHaptics: UserPreferencesRepository.shouldUseHaptics(),
    shouldPlaySounds: UserPreferencesRepository.shouldPlaySounds(),
    isDarkMode: preferences.darkMode === 'dark' || 
      (preferences.darkMode === 'auto' && new Date().getHours() > 18),
    isHighContrast: preferences.highContrastMode,
    isCompactMode: preferences.compactMode,
    analyticsEnabled: !preferences.analyticsOptOut,
    adPersonalizationEnabled: !preferences.adPersonalizationOptOut,
  };
};
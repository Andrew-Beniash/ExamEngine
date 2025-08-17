import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TopicProficiency, 
  WeakArea, 
  PracticeRecommendation, 
  LearningSession 
} from '../../../shared/types/mastery';
import { MasteryEngine } from '../MasteryEngine';
import { MasteryRepository } from '../../../data/repositories/MasteryRepository';
import { RepositoryFactory } from '../../../data/repositories/RepositoryFactory';
import { Difficulty } from '../../../shared/types/database';

interface MasteryStats {
  totalTopics: number;
  masteredTopics: number;
  weakAreas: number;
  averageProficiency: number;
  totalPracticeTime: number;
  streak: number;
}

interface UseMasteryReturn {
  // Data
  proficiencies: TopicProficiency[];
  weakAreas: WeakArea[];
  recommendations: PracticeRecommendation[];
  overallStats: MasteryStats;
  currentSession: LearningSession | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Actions
  processQuestionAttempt: (
    questionId: string,
    topicIds: string[],
    isCorrect: boolean,
    timeSpentMs: number,
    difficulty: Difficulty
  ) => Promise<void>;
  startLearningSession: (topicIds: string[]) => Promise<string>;
  endLearningSession: () => Promise<void>;
  followRecommendation: (recommendationId: string) => Promise<void>;
  refreshMasteryData: () => Promise<void>;
  getProficiencyTrends: (topicId: string, days?: number) => Promise<{ date: number; proficiency: number }[]>;
  
  // Utilities
  getMasteryLevel: (proficiency: number) => 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  getNextMilestone: (proficiency: number) => { target: number; label: string };
  calculateStudyStreak: () => number;
}

export const useMastery = (): UseMasteryReturn => {
  const [proficiencies, setProficiencies] = useState<TopicProficiency[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [overallStats, setOverallStats] = useState<MasteryStats>({
    totalTopics: 0,
    masteredTopics: 0,
    weakAreas: 0,
    averageProficiency: 0,
    totalPracticeTime: 0,
    streak: 0,
  });
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const masteryEngine = useRef(MasteryEngine.getInstance());
  const repository = useRef<MasteryRepository | null>(null);

  const refreshMasteryData = useCallback(async () => {
    if (!repository.current) return;

    try {
      setIsLoading(true);

      // Load all proficiencies
      const allProficiencies = await repository.current.getAllProficiencies();
      setProficiencies(allProficiencies);

      // Detect weak areas
      const detectedWeakAreas = masteryEngine.current.detectWeakAreas(allProficiencies);
      setWeakAreas(detectedWeakAreas);

      // Generate recommendations
      const recentSessions = await repository.current.getRecentSessions(5);
      const generatedRecommendations = masteryEngine.current.generateRecommendations(
        allProficiencies,
        recentSessions
      );
      
      // Save recommendations and set state
      await repository.current.savePracticeRecommendations(generatedRecommendations);
      setRecommendations(generatedRecommendations);

      // Load overall stats
      const stats = await repository.current.getOverallStats();
      setOverallStats(stats);

    } catch (error) {
      console.error('Failed to refresh mastery data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        const questionRepo = RepositoryFactory.getQuestionRepository();
        const db = (questionRepo as any).db; // Access underlying database
        repository.current = new MasteryRepository(db);
        await refreshMasteryData();
      } catch (error) {
        console.error('Failed to initialize mastery repository:', error);
        setIsLoading(false);
      }
    };

    initRepository();
  }, [refreshMasteryData]);

  const processQuestionAttempt = useCallback(async (
    questionId: string,
    topicIds: string[],
    isCorrect: boolean,
    timeSpentMs: number,
    difficulty: Difficulty
  ) => {
    if (!repository.current) return;

    try {
      setIsUpdating(true);
      const now = Date.now();

      // Process attempt through mastery engine
      const attempt = {
        questionId,
        topicIds,
        isCorrect,
        timeSpentMs,
        difficulty,
        attemptDate: now,
      };

      const proficiencyUpdates = masteryEngine.current.processQuestionAttempt(attempt);

      // Update database and state for each topic
      for (const update of proficiencyUpdates) {
        if (!update.topicId) continue;

        // Get current proficiency or create default
        let currentProf = proficiencies.find(p => p.topicId === update.topicId);
        if (!currentProf) {
          currentProf = await repository.current.getProficiencyByTopic(update.topicId) || undefined;
        }

        const proficiencyBefore = currentProf?.proficiency || 0.5;

        // Merge updates with current data
        const updatedProficiency = {
          ...currentProf,
          ...update,
          topicId: update.topicId,
        } as TopicProficiency;

        // Save to database
        await repository.current.upsertProficiency(updatedProficiency);

        // Record performance
        await repository.current.recordQuestionPerformance({
          questionId,
          topicId: update.topicId,
          isCorrect,
          timeSpentMs,
          difficulty,
          attemptDate: now,
          sessionId: currentSession?.id,
          proficiencyBefore,
          proficiencyAfter: updatedProficiency.proficiency,
        });

        // Update state
        setProficiencies(prev => {
          const newProficiencies = prev.filter(p => p.topicId !== update.topicId);
          return [...newProficiencies, updatedProficiency].sort((a, b) => a.topicId.localeCompare(b.topicId));
        });
      }

      // Update current session if active
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          questionsAnswered: currentSession.questionsAnswered + 1,
          correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
          timeSpent: currentSession.timeSpent + timeSpentMs,
        };
        setCurrentSession(updatedSession);

        await repository.current.updateLearningSession(currentSession.id, {
          questionsAnswered: updatedSession.questionsAnswered,
          correctAnswers: updatedSession.correctAnswers,
          timeSpent: updatedSession.timeSpent,
        });
      }

    } catch (error) {
      console.error('Failed to process question attempt:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [proficiencies, currentSession]);

  const startLearningSession = useCallback(async (topicIds: string[]): Promise<string> => {
    if (!repository.current) throw new Error('Repository not initialized');

    try {
      const sessionData: Omit<LearningSession, 'id'> = {
        startTime: Date.now(),
        topicsStudied: topicIds,
        questionsAnswered: 0,
        correctAnswers: 0,
        timeSpent: 0,
        proficiencyChanges: {},
        weakAreasImproved: [],
      };

      const sessionId = await repository.current.createLearningSession(sessionData);
      
      const newSession: LearningSession = {
        ...sessionData,
        id: sessionId,
      };
      
      setCurrentSession(newSession);
      return sessionId;

    } catch (error) {
      console.error('Failed to start learning session:', error);
      throw error;
    }
  }, []);

  const endLearningSession = useCallback(async () => {
    if (!repository.current || !currentSession) return;

    try {
      const endTime = Date.now();
      
      // Calculate proficiency changes during session
      const proficiencyChanges: Record<string, { before: number; after: number }> = {};
      for (const topicId of currentSession.topicsStudied) {
        const currentProf = proficiencies.find(p => p.topicId === topicId);
        if (currentProf) {
          // This is simplified - in practice you'd track the before state
          proficiencyChanges[topicId] = {
            before: currentProf.proficiency - 0.1, // Estimate
            after: currentProf.proficiency,
          };
        }
      }

      // Identify weak areas that were improved
      const weakAreasImproved = weakAreas
        .filter(wa => currentSession.topicsStudied.includes(wa.topicId))
        .map(wa => wa.topicId);

      await repository.current.updateLearningSession(currentSession.id, {
        endTime,
        proficiencyChanges,
        weakAreasImproved,
      });

      setCurrentSession(null);

      // Refresh data to reflect changes
      await refreshMasteryData();

    } catch (error) {
      console.error('Failed to end learning session:', error);
      setCurrentSession(null);
    }
  }, [currentSession, proficiencies, weakAreas, refreshMasteryData]);

  const followRecommendation = useCallback(async (recommendationId: string) => {
    if (!repository.current) return;

    try {
      await repository.current.markRecommendationUsed(recommendationId);
      
      // Remove from state
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));

    } catch (error) {
      console.error('Failed to follow recommendation:', error);
      throw error;
    }
  }, []);

  const getProficiencyTrends = useCallback(async (
    topicId: string, 
    days: number = 30
  ): Promise<{ date: number; proficiency: number }[]> => {
    if (!repository.current) return [];

    try {
      return await repository.current.getProficiencyTrends(topicId, days);
    } catch (error) {
      console.error('Failed to get proficiency trends:', error);
      return [];
    }
  }, []);

  const getMasteryLevel = useCallback((proficiency: number): 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert' => {
    if (proficiency >= 0.9) return 'expert';
    if (proficiency >= 0.8) return 'advanced';
    if (proficiency >= 0.7) return 'proficient';
    if (proficiency >= 0.5) return 'developing';
    return 'novice';
  }, []);

  const getNextMilestone = useCallback((proficiency: number): { target: number; label: string } => {
    if (proficiency < 0.5) return { target: 0.5, label: 'Developing' };
    if (proficiency < 0.7) return { target: 0.7, label: 'Proficient' };
    if (proficiency < 0.8) return { target: 0.8, label: 'Advanced' };
    if (proficiency < 0.9) return { target: 0.9, label: 'Expert' };
    return { target: 1.0, label: 'Master' };
  }, []);

  const calculateStudyStreak = useCallback((): number => {
    return overallStats.streak;
  }, [overallStats.streak]);

  return {
    // Data
    proficiencies,
    weakAreas,
    recommendations,
    overallStats,
    currentSession,
    
    // Loading states
    isLoading,
    isUpdating,
    
    // Actions
    processQuestionAttempt,
    startLearningSession,
    endLearningSession,
    followRecommendation,
    refreshMasteryData,
    getProficiencyTrends,
    
    // Utilities
    getMasteryLevel,
    getNextMilestone,
    calculateStudyStreak,
  };
};
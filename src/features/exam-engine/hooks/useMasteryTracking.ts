import { useEffect, useCallback, useRef } from 'react';
import { useMastery } from '../../mastery/hooks/useMastery';
import { Question } from '../../../shared/types/database';
import { useExamSession } from '../../../shared/hooks';

interface MasteryTrackingOptions {
  enableRealTimeTracking?: boolean;
  enableRecommendations?: boolean;
  autoStartLearningSession?: boolean;
}

interface UseMasteryTrackingReturn {
  trackQuestionAttempt: (
    question: Question,
    selectedAnswers: string[],
    timeSpentMs: number,
    isCorrect: boolean
  ) => Promise<void>;
  startMasterySession: (topicIds: string[]) => Promise<void>;
  endMasterySession: () => Promise<void>;
  getMasteryFeedback: (question: Question, isCorrect: boolean) => string;
  isTrackingEnabled: boolean;
}

export const useMasteryTracking = (
  options: MasteryTrackingOptions = {}
): UseMasteryTrackingReturn => {
  const {
    enableRealTimeTracking = true,
    enableRecommendations = true,
    autoStartLearningSession = true,
  } = options;

  const {
    processQuestionAttempt,
    startLearningSession,
    endLearningSession,
    proficiencies,
    currentSession,
    getMasteryLevel,
    getNextMilestone,
  } = useMastery();

  const examSession = useExamSession();
  const sessionStarted = useRef(false);

  const startMasterySession = useCallback(async (topicIds: string[]) => {
    try {
      if (currentSession) {
        console.log('Learning session already active');
        return;
      }
      
      await startLearningSession(topicIds);
      console.log('Started mastery tracking session for topics:', topicIds);
    } catch (error) {
      console.error('Failed to start mastery session:', error);
    }
  }, [startLearningSession, currentSession]);

  const endMasterySession = useCallback(async () => {
    try {
      if (!currentSession) {
        console.log('No active learning session to end');
        return;
      }
      
      await endLearningSession();
      console.log('Ended mastery tracking session');
    } catch (error) {
      console.error('Failed to end mastery session:', error);
    }
  }, [endLearningSession, currentSession]);

  // Auto-start learning session when exam begins
  useEffect(() => {
    if (
      autoStartLearningSession && 
      examSession.isActive && 
      examSession.questions.length > 0 && 
      !sessionStarted.current &&
      !currentSession
    ) {
      const topicIds = extractTopicsFromQuestions(examSession.questions);
      startMasterySession(topicIds);
      sessionStarted.current = true;
    }
  }, [
    examSession.isActive, 
    examSession.questions, 
    autoStartLearningSession, 
    currentSession, 
    startMasterySession
  ]);

  // Auto-end session when exam finishes
  useEffect(() => {
    if (!examSession.isActive && sessionStarted.current && currentSession) {
      endMasterySession();
      sessionStarted.current = false;
    }
  }, [examSession.isActive, currentSession, endMasterySession]);

  const trackQuestionAttempt = useCallback(async (
    question: Question,
    selectedAnswers: string[],
    timeSpentMs: number,
    isCorrect: boolean
  ) => {
    if (!enableRealTimeTracking) return;

    try {
      await processQuestionAttempt(
        question.id,
        question.topicIds,
        isCorrect,
        timeSpentMs,
        question.difficulty
      );
    } catch (error) {
      console.error('Failed to track question attempt for mastery:', error);
    }
  }, [enableRealTimeTracking, processQuestionAttempt]);

  const getMasteryFeedback = useCallback((
    question: Question, 
    isCorrect: boolean
  ): string => {
    if (!enableRecommendations) return '';

    const topicProficiencies = question.topicIds
      .map(topicId => proficiencies.find(p => p.topicId === topicId))
      .filter(Boolean);

    if (topicProficiencies.length === 0) {
      return isCorrect 
        ? 'Great job! Keep practicing to build proficiency.'
        : 'Review the explanation to understand this concept better.';
    }

    const avgProficiency = topicProficiencies.reduce(
      (sum, prof) => sum + (prof?.proficiency || 0), 
      0
    ) / topicProficiencies.length;

    const masteryLevel = getMasteryLevel(avgProficiency);
    const nextMilestone = getNextMilestone(avgProficiency);

    if (isCorrect) {
      switch (masteryLevel) {
        case 'novice':
          return '🌱 Good start! You\'re building foundational knowledge in this area.';
        case 'developing':
          return `📈 Nice progress! You're ${Math.round((avgProficiency - 0.5) * 200)}% of the way to proficient level.`;
        case 'proficient':
          return `✅ Well done! You're proficient in this topic. ${Math.round((nextMilestone.target - avgProficiency) * 100)}% to ${nextMilestone.label}.`;
        case 'advanced':
          return '🎯 Excellent! You have advanced mastery of this topic.';
        case 'expert':
          return '🏆 Outstanding! You have expert-level knowledge.';
        default:
          return 'Great job on this question!';
      }
    } else {
      const lowestProfTopic = topicProficiencies.reduce((lowest, current) => 
        (current?.proficiency || 0) < (lowest?.proficiency || 1) ? current : lowest
      );

      if (lowestProfTopic && lowestProfTopic.proficiency < 0.6) {
        return `🎯 This topic needs more practice. Consider focusing on ${getTopicDisplayName(lowestProfTopic.topicId)} concepts.`;
      } else {
        return '💡 Review the explanation carefully. Understanding mistakes helps build mastery.';
      }
    }
  }, [enableRecommendations, proficiencies, getMasteryLevel, getNextMilestone]);

  return {
    trackQuestionAttempt,
    startMasterySession,
    endMasterySession,
    getMasteryFeedback,
    isTrackingEnabled: enableRealTimeTracking,
  };
};

// Helper functions
const extractTopicsFromQuestions = (_questionIds: string[]): string[] => {
  // This is a simplified approach - in practice, you'd query the database
  // for the actual questions and extract their topic IDs
  const commonTopics = [
    'planning',
    'elicitation', 
    'requirements-analysis',
    'strategy-analysis',
    'stakeholder-engagement'
  ];
  
  return commonTopics;
};

const getTopicDisplayName = (topicId: string): string => {
  const topicNames: Record<string, string> = {
    'planning': 'Business Analysis Planning',
    'elicitation': 'Requirements Elicitation',
    'requirements-analysis': 'Requirements Analysis',
    'traceability': 'Requirements Traceability',
    'validation': 'Requirements Validation',
    'solution-evaluation': 'Solution Evaluation',
    'strategy-analysis': 'Strategy Analysis',
    'stakeholder-engagement': 'Stakeholder Engagement',
    'governance': 'BA Governance',
    'techniques': 'BA Techniques',
  };
  return topicNames[topicId] || topicId.replace('-', ' ');
};
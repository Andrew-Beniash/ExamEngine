import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './';
import {
  startSession,
  answerQuestion,
  navigateToQuestion,
  flagQuestion,
  bookmarkQuestion,
  updateTimer,
  pauseTimer,
  resumeTimer,
  endSession,
  enterReviewMode,
  clearSession,
  timeExpired,
  autoSave,
} from '../../features/exam-engine/state/examSessionSlice';

export const useExamSession = () => {
  const dispatch = useAppDispatch();
  const examSession = useAppSelector((state) => state.examSession);

  const startExamSession = useCallback((params: {
    sessionId: string;
    templateId?: string;
    packId: string;
    questions: string[];
    durationMs?: number;
  }) => {
    dispatch(startSession(params));
  }, [dispatch]);

  const answerCurrentQuestion = useCallback((selectedIds: string[], timeSpentMs: number) => {
    const currentQuestionId = examSession.questions[examSession.currentQuestionIndex];
    if (currentQuestionId) {
      dispatch(answerQuestion({
        questionId: currentQuestionId,
        selectedIds,
        timeSpentMs,
      }));
    }
  }, [dispatch, examSession.questions, examSession.currentQuestionIndex]);

  const navigateQuestion = useCallback((index: number) => {
    dispatch(navigateToQuestion(index));
  }, [dispatch]);

  const toggleFlag = useCallback((questionId: string) => {
    dispatch(flagQuestion(questionId));
  }, [dispatch]);

  const toggleBookmark = useCallback((questionId: string) => {
    dispatch(bookmarkQuestion(questionId));
  }, [dispatch]);

  const updateTimerValue = useCallback((remainingMs: number) => {
    dispatch(updateTimer(remainingMs));
  }, [dispatch]);

  const pauseExamTimer = useCallback(() => {
    dispatch(pauseTimer());
  }, [dispatch]);

  const resumeExamTimer = useCallback(() => {
    dispatch(resumeTimer());
  }, [dispatch]);

  const handleTimeExpired = useCallback(() => {
    dispatch(timeExpired());
  }, [dispatch]);

  const finishSession = useCallback(() => {
    dispatch(endSession());
  }, [dispatch]);

  const startReview = useCallback((showCorrectAnswers = false) => {
    dispatch(enterReviewMode({ showCorrectAnswers }));
  }, [dispatch]);

  const triggerAutoSave = useCallback(() => {
    dispatch(autoSave());
  }, [dispatch]);

  const resetSession = useCallback(() => {
    dispatch(clearSession());
  }, [dispatch]);

  return {
    // State
    ...examSession,
    
    // Current question helpers
    currentQuestionId: examSession.questions[examSession.currentQuestionIndex],
    currentAnswers: examSession.questions[examSession.currentQuestionIndex] 
      ? examSession.answers[examSession.questions[examSession.currentQuestionIndex]] || []
      : [],
    totalQuestions: examSession.questions.length,
    isFlagged: examSession.currentQuestionIndex >= 0 
      ? examSession.flaggedQuestions.includes(examSession.questions[examSession.currentQuestionIndex])
      : false,
    isBookmarked: examSession.currentQuestionIndex >= 0
      ? examSession.bookmarkedQuestions.includes(examSession.questions[examSession.currentQuestionIndex])
      : false,
    
    // Timer helpers
    hasTimeLimit: examSession.remainingTimeMs !== null,
    isTimedExam: examSession.remainingTimeMs !== null && examSession.remainingTimeMs > 0,
    
    // Actions
    startExamSession,
    answerCurrentQuestion,
    navigateQuestion,
    toggleFlag,
    toggleBookmark,
    updateTimer: updateTimerValue,
    pauseTimer: pauseExamTimer,
    resumeTimer: resumeExamTimer,
    handleTimeExpired,
    finishSession,
    startReview,
    resetSession,
    autoSave: triggerAutoSave,
  };
};
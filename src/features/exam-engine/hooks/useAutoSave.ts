import { useEffect, useRef } from 'react';
import { useExamSession } from '../../../shared/hooks';
import { Question } from '../../../shared/types/database';

export const useAutoSave = (_questions: Question[]) => {
  const examSession = useExamSession();
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (examSession.isActive && !examSession.isReviewMode && examSession.sessionId) {
      // Auto-save every 5 seconds
      saveIntervalRef.current = setInterval(() => {
        try {
          // Update the lastSavedAt timestamp in Redux
          examSession.autoSave();
          
          // Log for debugging
          const currentAnswers = Object.keys(examSession.answers);
          if (currentAnswers.length > 0) {
            console.log(`Auto-save: ${currentAnswers.length} answers saved at ${new Date().toLocaleTimeString()}`);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 5000);
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSession.isActive, examSession.isReviewMode, examSession.sessionId]);

  // Return auto-save status for debugging
  return {
    isAutoSaveActive: saveIntervalRef.current !== null,
    lastSavedAt: examSession.lastSavedAt,
  };
};
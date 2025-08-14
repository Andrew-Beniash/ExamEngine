import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExamSessionState {
  // Current session info
  sessionId: string | null;
  templateId: string | null;
  packId: string | null;
  isActive: boolean;
  
  // Questions and progress
  questions: string[]; // Array of question IDs
  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selected choice IDs
  flaggedQuestions: string[]; // Changed from Set to array for serialization
  bookmarkedQuestions: string[]; // Changed from Set to array for serialization
  
  // Timing
  startTime: number | null;
  endTime: number | null;
  timeSpentPerQuestion: Record<string, number>; // questionId -> milliseconds
  remainingTimeMs: number | null;
  
  // Session state
  isTimerRunning: boolean;
  lastSavedAt: number | null;
  
  // Review mode
  isReviewMode: boolean;
  showCorrectAnswers: boolean;
}

const initialState: ExamSessionState = {
  sessionId: null,
  templateId: null,
  packId: null,
  isActive: false,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: [],
  bookmarkedQuestions: [],
  startTime: null,
  endTime: null,
  timeSpentPerQuestion: {},
  remainingTimeMs: null,
  isTimerRunning: false,
  lastSavedAt: null,
  isReviewMode: false,
  showCorrectAnswers: false,
};

export const examSessionSlice = createSlice({
  name: 'examSession',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{
      sessionId: string;
      templateId?: string;
      packId: string;
      questions: string[];
      durationMs?: number;
    }>) => {
      const { sessionId, templateId, packId, questions, durationMs } = action.payload;
      state.sessionId = sessionId;
      state.templateId = templateId || null; // Convert undefined to null
      state.packId = packId;
      state.questions = questions;
      state.isActive = true;
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.flaggedQuestions = [];
      state.bookmarkedQuestions = [];
      state.startTime = Date.now();
      state.endTime = null;
      state.remainingTimeMs = durationMs || null; // Convert undefined to null
      state.isTimerRunning = true;
      state.timeSpentPerQuestion = {};
      state.isReviewMode = false;
      state.showCorrectAnswers = false;
    },

    answerQuestion: (state, action: PayloadAction<{
      questionId: string;
      selectedIds: string[];
      timeSpentMs: number;
    }>) => {
      const { questionId, selectedIds, timeSpentMs } = action.payload;
      state.answers[questionId] = selectedIds;
      state.timeSpentPerQuestion[questionId] = timeSpentMs;
    },

    navigateToQuestion: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index;
      }
    },

    flagQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      const index = state.flaggedQuestions.indexOf(questionId);
      if (index >= 0) {
        state.flaggedQuestions.splice(index, 1);
      } else {
        state.flaggedQuestions.push(questionId);
      }
    },

    bookmarkQuestion: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      const index = state.bookmarkedQuestions.indexOf(questionId);
      if (index >= 0) {
        state.bookmarkedQuestions.splice(index, 1);
      } else {
        state.bookmarkedQuestions.push(questionId);
      }
    },

    updateTimer: (state, action: PayloadAction<number>) => {
      state.remainingTimeMs = action.payload;
      if (action.payload <= 0) {
        // Auto-end session when time expires
        state.isActive = false;
        state.endTime = Date.now();
        state.isTimerRunning = false;
      }
    },

    pauseTimer: (state) => {
      state.isTimerRunning = false;
    },

    resumeTimer: (state) => {
      state.isTimerRunning = true;
    },

    endSession: (state) => {
      state.isActive = false;
      state.endTime = Date.now();
      state.isTimerRunning = false;
    },

    enterReviewMode: (state, action: PayloadAction<{ showCorrectAnswers?: boolean }>) => {
      state.isReviewMode = true;
      state.showCorrectAnswers = action.payload.showCorrectAnswers || false;
      state.isTimerRunning = false;
    },

    autoSave: (state) => {
      state.lastSavedAt = Date.now();
    },

    restoreSession: (state, action: PayloadAction<Partial<ExamSessionState>>) => {
      return { ...state, ...action.payload };
    },

    clearSession: () => initialState,

    timeExpired: (state) => {
      state.isActive = false;
      state.endTime = Date.now();
      state.isTimerRunning = false;
      state.remainingTimeMs = 0;
    },
  },
});

export const {
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
  autoSave,
  restoreSession,
  clearSession,
  timeExpired,
} = examSessionSlice.actions;

export default examSessionSlice.reducer;
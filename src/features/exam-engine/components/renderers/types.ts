import { Question } from '../../../../shared/types/database';

export interface QuestionRendererProps {
  question: Question;
  selectedAnswers: string[];
  onAnswerChange: (selectedIds: string[]) => void;
  isReviewMode?: boolean;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

export interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  isFlagged: boolean;
  isBookmarked: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFlag: () => void;
  onBookmark: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

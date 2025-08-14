import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from 'react-native';
import { Question } from '../../../shared/types/database';
import SingleChoiceRenderer from './renderers/SingleChoiceRenderer';
import MultiChoiceRenderer from './renderers/MultiChoiceRenderer';
import QuestionNavigation from './QuestionNavigation';

interface QuestionPlayerProps {
  questions: Question[];
  currentIndex: number;
  onQuestionChange: (index: number) => void;
  onAnswerChange: (questionIndex: number, selectedIds: string[]) => void;
  answers: Record<string, string[]>;
  flaggedQuestions: Set<string>;
  bookmarkedQuestions: Set<string>;
  onFlag: (questionId: string) => void;
  onBookmark: (questionId: string) => void;
  isReviewMode?: boolean;
  showCorrectAnswers?: boolean;
}

const QuestionPlayer: React.FC<QuestionPlayerProps> = ({
  questions,
  currentIndex,
  onQuestionChange,
  onAnswerChange,
  answers,
  flaggedQuestions,
  bookmarkedQuestions,
  onFlag,
  onBookmark,
  isReviewMode = false,
  showCorrectAnswers = false,
}) => {
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const selectedAnswers = currentQuestionId ? (answers[currentQuestionId] || []) : [];

  const handleAnswerChange = (selectedIds: string[]) => {
    onAnswerChange(currentIndex, selectedIds);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onQuestionChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      onQuestionChange(currentIndex + 1);
    }
  };

  const handleFlag = () => {
    if (currentQuestionId) {
      onFlag(currentQuestionId);
    }
  };

  const handleBookmark = () => {
    if (currentQuestionId) {
      onBookmark(currentQuestionId);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      question: currentQuestion,
      selectedAnswers,
      onAnswerChange: handleAnswerChange,
      showCorrectAnswer: showCorrectAnswers,
      disabled: isReviewMode && !showCorrectAnswers,
    };

    switch (currentQuestion.type) {
      case 'single':
        return <SingleChoiceRenderer {...commonProps} />;
      case 'multi':
        return <MultiChoiceRenderer {...commonProps} />;
      case 'scenario':
        // For now, treat scenarios like single choice
        return <SingleChoiceRenderer {...commonProps} />;
      case 'order':
        // TODO: Implement OrderingRenderer
        return <SingleChoiceRenderer {...commonProps} />;
      default:
        return <SingleChoiceRenderer {...commonProps} />;
    }
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderQuestion()}
      </ScrollView>

      <QuestionNavigation
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        isFlagged={flaggedQuestions.has(currentQuestionId || '')}
        isBookmarked={bookmarkedQuestions.has(currentQuestionId || '')}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFlag={handleFlag}
        onBookmark={handleBookmark}
        canGoBack={currentIndex > 0}
        canGoForward={currentIndex < questions.length - 1}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default QuestionPlayer;
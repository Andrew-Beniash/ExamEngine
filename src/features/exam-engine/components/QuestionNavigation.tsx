import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QuestionNavigationProps } from './renderers/types';

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  currentIndex,
  totalQuestions,
  isFlagged,
  isBookmarked,
  onPrevious,
  onNext,
  onFlag,
  onBookmark,
  canGoBack,
  canGoForward,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.questionCounter}>
          <Text style={styles.counterText}>
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, isFlagged && styles.actionButtonActive]}
            onPress={onFlag}
            accessibilityLabel={isFlagged ? 'Remove flag' : 'Flag question'}
          >
            <Text style={[styles.actionButtonText, isFlagged && styles.actionButtonTextActive]}>
              🚩
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isBookmarked && styles.actionButtonActive]}
            onPress={onBookmark}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
          >
            <Text style={[styles.actionButtonText, isBookmarked && styles.actionButtonTextActive]}>
              🔖
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.previousButton,
            !canGoBack && styles.disabledButton
          ]}
          onPress={onPrevious}
          disabled={!canGoBack}
          accessibilityLabel="Previous question"
        >
          <Text style={[
            styles.navigationButtonText,
            !canGoBack && styles.disabledButtonText
          ]}>
            ← Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.progressIndicator}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / totalQuestions) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.nextButton,
            !canGoForward && styles.disabledButton
          ]}
          onPress={onNext}
          disabled={!canGoForward}
          accessibilityLabel="Next question"
        >
          <Text style={[
            styles.navigationButtonText,
            !canGoForward && styles.disabledButtonText
          ]}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCounter: {
    flex: 1,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonActive: {
    backgroundColor: '#2B5CE6',
    borderColor: '#2B5CE6',
  },
  actionButtonText: {
    fontSize: 16,
  },
  actionButtonTextActive: {
    // Emoji color doesn't change, but we could add a background indicator
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navigationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  previousButton: {
    backgroundColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: '#2B5CE6',
  },
  disabledButton: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  navigationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  progressIndicator: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2B5CE6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default QuestionNavigation;

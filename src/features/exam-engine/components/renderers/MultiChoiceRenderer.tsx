import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { QuestionRendererProps } from './types';

const MultiChoiceRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedAnswers,
  onAnswerChange,
  // isReviewMode = false, // Commented out since not used
  showCorrectAnswer = false,
  disabled = false,
}) => {
  const handleChoiceToggle = (choiceId: string) => {
    if (disabled) return;
    
    const newSelection = selectedAnswers.includes(choiceId)
      ? selectedAnswers.filter(id => id !== choiceId)
      : [...selectedAnswers, choiceId];
    
    onAnswerChange(newSelection);
  };

  const getChoiceStyle = (choiceId: string) => {
    const isSelected = selectedAnswers.includes(choiceId);
    const isCorrect = question.correct?.includes(choiceId);
    const shouldBeSelected = question.correct?.includes(choiceId);
    const isIncorrect = (isSelected && !isCorrect) || (!isSelected && shouldBeSelected && showCorrectAnswer);

    let backgroundColor = '#FFFFFF';
    let borderColor = '#E5E7EB';

    if (isSelected && !showCorrectAnswer) {
      backgroundColor = '#EBF4FF';
      borderColor = '#2B5CE6';
    } else if (showCorrectAnswer) {
      if (isSelected && isCorrect) {
        backgroundColor = '#ECFDF5';
        borderColor = '#059669';
      } else if (isIncorrect) {
        backgroundColor = '#FEF2F2';
        borderColor = '#EF4444';
      } else if (!isSelected && isCorrect) {
        backgroundColor = '#FEF3C7';
        borderColor = '#F59E0B';
      }
    }

    return { backgroundColor, borderColor };
  };

  const getRequiredSelections = (): string => {
    const correctCount = question.correct?.length || 0;
    if (correctCount === 1) return 'Select 1 answer';
    return `Select ${correctCount} answers`;
  };

  const renderChoice = (choice: { id: string; text: string }, index: number) => {
    const choiceStyle = getChoiceStyle(choice.id);
    const isSelected = selectedAnswers.includes(choice.id);

    return (
      <TouchableOpacity
        key={choice.id}
        style={[
          styles.choiceContainer,
          choiceStyle,
          disabled && styles.disabledChoice
        ]}
        onPress={() => handleChoiceToggle(choice.id)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`Choice ${String.fromCharCode(65 + index)}: ${choice.text}`}
      >
        <View style={styles.choiceContent}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
            showCorrectAnswer && question.correct?.includes(choice.id) && styles.checkboxCorrect,
          ]}>
            {isSelected && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          
          <View style={styles.choiceTextContainer}>
            <Text style={styles.choiceLabel}>
              {String.fromCharCode(65 + index)}.
            </Text>
            <Text style={styles.choiceText}>{choice.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionStem}>
        <RenderHtml
          contentWidth={300}
          source={{ html: question.stem }}
          tagsStyles={{
            p: { margin: 0, fontSize: 16, lineHeight: 24, color: '#374151' },
            strong: { fontWeight: '600' },
            em: { fontStyle: 'italic' },
          }}
        />
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>{getRequiredSelections()}</Text>
      </View>

      <View style={styles.choicesContainer}>
        {question.choices?.map((choice, index) => renderChoice(choice, index))}
      </View>

      {question.explanation && showCorrectAnswer && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>Explanation:</Text>
          <RenderHtml
            contentWidth={300}
            source={{ html: question.explanation }}
            tagsStyles={{
              p: { margin: 0, fontSize: 14, lineHeight: 20, color: '#6B7280' },
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionStem: {
    marginBottom: 16,
  },
  instructionContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  choicesContainer: {
    gap: 12,
  },
  choiceContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
  },
  disabledChoice: {
    opacity: 0.6,
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#2B5CE6',
    backgroundColor: '#2B5CE6',
  },
  checkboxCorrect: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  choiceTextContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
    minWidth: 24,
  },
  choiceText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    flex: 1,
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2B5CE6',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
});

export default MultiChoiceRenderer;
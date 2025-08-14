import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { QuestionRendererProps } from './types';
import ExhibitViewer from '../ExhibitViewer';

const ScenarioRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedAnswers,
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  const [showExhibits, setShowExhibits] = useState(false);
  const [currentExhibitIndex, setCurrentExhibitIndex] = useState(0);

  const handleChoiceSelect = (choiceId: string) => {
    if (disabled) return;
    
    // For scenario questions, determine if single or multi-select based on correct answers
    const isMultiSelect = question.correct && question.correct.length > 1;
    
    if (isMultiSelect) {
      // Multi-select logic
      const newSelection = selectedAnswers.includes(choiceId)
        ? selectedAnswers.filter(id => id !== choiceId)
        : [...selectedAnswers, choiceId];
      onAnswerChange(newSelection);
    } else {
      // Single-select logic
      onAnswerChange([choiceId]);
    }
  };

  const openExhibits = (startIndex = 0) => {
    setCurrentExhibitIndex(startIndex);
    setShowExhibits(true);
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

  const getSelectionIcon = (choiceId: string) => {
    const isSelected = selectedAnswers.includes(choiceId);
    const isMultiSelect = question.correct && question.correct.length > 1;
    
    if (isMultiSelect) {
      return (
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected,
          showCorrectAnswer && question.correct?.includes(choiceId) && styles.checkboxCorrect,
        ]}>
          {isSelected && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
          showCorrectAnswer && question.correct?.includes(choiceId) && styles.radioButtonCorrect,
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      );
    }
  };

  const renderChoice = (choice: { id: string; text: string }, index: number) => {
    const choiceStyle = getChoiceStyle(choice.id);
    const isSelected = selectedAnswers.includes(choice.id);
    const isMultiSelect = question.correct && question.correct.length > 1;

    return (
      <TouchableOpacity
        key={choice.id}
        style={[
          styles.choiceContainer,
          choiceStyle,
          disabled && styles.disabledChoice
        ]}
        onPress={() => handleChoiceSelect(choice.id)}
        disabled={disabled}
        accessibilityRole={isMultiSelect ? "checkbox" : "radio"}
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`Choice ${String.fromCharCode(65 + index)}: ${choice.text}`}
      >
        <View style={styles.choiceContent}>
          {getSelectionIcon(choice.id)}
          
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

  const renderExhibitButton = () => {
    if (!question.exhibits || question.exhibits.length === 0) {
      return null;
    }

    return (
      <View style={styles.exhibitSection}>
        <TouchableOpacity
          style={styles.exhibitButton}
          onPress={() => openExhibits(0)}
        >
          <Text style={styles.exhibitButtonIcon}>📊</Text>
          <View style={styles.exhibitButtonContent}>
            <Text style={styles.exhibitButtonText}>
              View Exhibits ({question.exhibits.length})
            </Text>
            <Text style={styles.exhibitButtonSubtext}>
              Tap to view diagrams, charts, and reference materials
            </Text>
          </View>
          <Text style={styles.exhibitButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getInstructionText = () => {
    const isMultiSelect = question.correct && question.correct.length > 1;
    if (isMultiSelect) {
      return `Select ${question.correct?.length || 2} answers`;
    }
    return 'Select the best answer';
  };

  return (
    <View style={styles.container}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioLabel}>📋 Scenario Question</Text>
        {question.exhibits && question.exhibits.length > 0 && (
          <TouchableOpacity
            style={styles.quickExhibitButton}
            onPress={() => openExhibits(0)}
          >
            <Text style={styles.quickExhibitText}>📊 Exhibits</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Question Stem */}
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

      {/* Exhibit Button */}
      {renderExhibitButton()}

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>{getInstructionText()}</Text>
      </View>

      {/* Answer Choices */}
      <View style={styles.choicesContainer}>
        {question.choices?.map((choice, index) => renderChoice(choice, index))}
      </View>

      {/* Explanation */}
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

      {/* Exhibit Viewer Modal */}
      {question.exhibits && question.exhibits.length > 0 && (
        <ExhibitViewer
          exhibits={question.exhibits}
          visible={showExhibits}
          onClose={() => setShowExhibits(false)}
          currentExhibitIndex={currentExhibitIndex}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  scenarioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  quickExhibitButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickExhibitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  questionStem: {
    marginBottom: 20,
  },
  exhibitSection: {
    marginBottom: 20,
  },
  exhibitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderWidth: 2,
    borderColor: '#EAB308',
    borderRadius: 12,
    padding: 16,
    borderStyle: 'dashed',
  },
  exhibitButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exhibitButtonContent: {
    flex: 1,
  },
  exhibitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  exhibitButtonSubtext: {
    fontSize: 12,
    color: '#A16207',
  },
  exhibitButtonArrow: {
    fontSize: 20,
    color: '#EAB308',
    fontWeight: 'bold',
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
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2B5CE6',
  },
  radioButtonCorrect: {
    borderColor: '#059669',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B5CE6',
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

export default ScenarioRenderer;
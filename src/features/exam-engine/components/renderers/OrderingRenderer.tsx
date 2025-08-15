import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Vibration,
  TransformsStyle,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { QuestionRendererProps } from './types';

const { width: screenWidth } = Dimensions.get('window');

interface DraggableItem {
  id: string;
  text: string;
  currentIndex: number;
  originalIndex: number;
}

const OrderingRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedAnswers,
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  // Initialize draggable items from question choices
  const [items, setItems] = useState<DraggableItem[]>(() => {
    if (!question.choices) return [];
    
    // If we have selected answers, use that order; otherwise use original order
    if (selectedAnswers.length > 0) {
      return selectedAnswers.map((answerId, index) => {
        const choice = question.choices?.find(c => c.id === answerId);
        const originalIndex = question.choices?.findIndex(c => c.id === answerId) || 0;
        return {
          id: answerId,
          text: choice?.text || '',
          currentIndex: index,
          originalIndex,
        };
      });
    }
    
    return question.choices.map((choice, index) => ({
      id: choice.id,
      text: choice.text,
      currentIndex: index,
      originalIndex: index,
    }));
  });

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropZoneIndex, setDropZoneIndex] = useState<number | null>(null);

  // Create animated values for each item
  const animatedValues = React.useRef(
    items.reduce((acc, item) => {
      acc[item.id] = new Animated.Value(0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    // Update current indices
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      currentIndex: index,
    }));

    setItems(updatedItems);
    
    // Update selected answers to maintain order
    const newOrder = updatedItems.map(item => item.id);
    onAnswerChange(newOrder);

    // Haptic feedback
    Vibration.vibrate(50);
  };

  const createPanResponder = (itemId: string, itemIndex: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      
      onPanResponderGrant: () => {
        setDraggedItemId(itemId);
        Animated.spring(animatedValues[itemId], {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (evt, gestureState) => {
        // Calculate which drop zone we're over
        const itemHeight = 80; // Approximate height of each item
        const currentY = gestureState.moveY;
        const newDropIndex = Math.floor(currentY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, newDropIndex));
        
        if (clampedIndex !== dropZoneIndex) {
          setDropZoneIndex(clampedIndex);
        }
      },

      onPanResponderRelease: () => {
        setDraggedItemId(null);
        
        if (dropZoneIndex !== null && dropZoneIndex !== itemIndex) {
          reorderItems(itemIndex, dropZoneIndex);
        }
        
        setDropZoneIndex(null);
        
        Animated.spring(animatedValues[itemId], {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    });
  };

  const getItemStyle = (itemId: string, index: number) => {
    const isDragged = draggedItemId === itemId;
    const isCorrectPosition = showCorrectAnswer && question.correctOrder?.[index] === itemId;
    const isIncorrectPosition = showCorrectAnswer && question.correctOrder?.[index] !== itemId;

    let backgroundColor = '#FFFFFF';
    let borderColor = '#E5E7EB';
    let transform: TransformsStyle['transform'] = [];

    if (isDragged) {
      backgroundColor = '#F3F4F6';
      borderColor = '#6B7280';
      transform = [
        {
          scale: animatedValues[itemId].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          }),
        },
        {
          rotate: animatedValues[itemId].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '2deg'],
          }),
        },
      ];
    } else if (showCorrectAnswer) {
      if (isCorrectPosition) {
        backgroundColor = '#ECFDF5';
        borderColor = '#059669';
      } else if (isIncorrectPosition) {
        backgroundColor = '#FEF2F2';
        borderColor = '#EF4444';
      }
    }

    return {
      backgroundColor,
      borderColor,
      transform,
    };
  };

  const getPositionIndicator = (index: number) => {
    const isCorrectPosition = showCorrectAnswer && 
      question.correctOrder?.[index] === items[index]?.id;
    const isIncorrectPosition = showCorrectAnswer && 
      question.correctOrder?.[index] !== items[index]?.id;

    let indicatorColor = '#6B7280';
    let indicatorText = (index + 1).toString();

    if (showCorrectAnswer) {
      if (isCorrectPosition) {
        indicatorColor = '#059669';
        indicatorText = '✓';
      } else if (isIncorrectPosition) {
        indicatorColor = '#EF4444';
        indicatorText = '✗';
      }
    }

    return (
      <View style={[styles.positionIndicator, { borderColor: indicatorColor }]}>
        <Text style={[styles.positionText, { color: indicatorColor }]}>
          {indicatorText}
        </Text>
      </View>
    );
  };

  const renderDropZone = (index: number) => {
    const isActive = dropZoneIndex === index;
    
    return (
      <View
        key={`dropzone-${index}`}
        style={[
          styles.dropZone,
          isActive && styles.activeDropZone,
        ]}
      >
        {isActive && (
          <Text style={styles.dropZoneText}>Drop here</Text>
        )}
      </View>
    );
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      reorderItems(index, index - 1);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < items.length - 1) {
      reorderItems(index, index + 1);
    }
  };

  const calculateScore = () => {
    if (!question.correctOrder) return 0;
    
    let exactMatches = 0;
    let partialCredit = 0;
    
    items.forEach((item, index) => {
      if (question.correctOrder?.[index] === item.id) {
        exactMatches++;
      } else {
        // Partial credit: item is in roughly correct area
        const correctIndex = question.correctOrder?.indexOf(item.id) || 0;
        const distance = Math.abs(index - correctIndex);
        if (distance <= 1) {
          partialCredit += 0.5;
        }
      }
    });

    const totalScore = exactMatches + partialCredit;
    return Math.min(100, (totalScore / items.length) * 100);
  };

  return (
    <View style={styles.container}>
      {/* Question Stem */}
      <View style={styles.questionStem}>
        <RenderHtml
          contentWidth={screenWidth - 32}
          source={{ html: question.stem }}
          tagsStyles={{
            p: { margin: 0, fontSize: 16, lineHeight: 24, color: '#374151' },
            strong: { fontWeight: '600' },
            em: { fontStyle: 'italic' },
          }}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          📋 Drag items to reorder them in the correct sequence
        </Text>
        <Text style={styles.instructionSubtext}>
          Use the ↑↓ buttons for keyboard accessibility
        </Text>
      </View>

      {/* Ordering Interface */}
      <View style={styles.orderingContainer}>
        {items.map((item, index) => {
          const panResponder = createPanResponder(item.id, index);
          const itemStyle = getItemStyle(item.id, index);
          const isDragged = draggedItemId === item.id;

          return (
            <View key={item.id} style={styles.itemWrapper}>
              {/* Drop zone above each item */}
              {index === 0 && renderDropZone(-1)}
              
              <Animated.View
                style={[
                  styles.orderingItem,
                  itemStyle,
                  isDragged && styles.draggedItem,
                ]}
                {...panResponder.panHandlers}
              >
                {/* Position Indicator */}
                {getPositionIndicator(index)}

                {/* Item Content */}
                <View style={styles.itemContent}>
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>

                {/* Accessibility Controls */}
                {!isDragged && (
                  <View style={styles.accessibilityControls}>
                    <TouchableOpacity
                      style={[
                        styles.moveButton,
                        index === 0 && styles.disabledButton,
                      ]}
                      onPress={() => moveItemUp(index)}
                      disabled={disabled || index === 0}
                      accessibilityLabel={`Move ${item.text} up`}
                    >
                      <Text style={styles.moveButtonText}>↑</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.moveButton,
                        index === items.length - 1 && styles.disabledButton,
                      ]}
                      onPress={() => moveItemDown(index)}
                      disabled={disabled || index === items.length - 1}
                      accessibilityLabel={`Move ${item.text} down`}
                    >
                      <Text style={styles.moveButtonText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Drag Handle */}
                {!disabled && !isDragged && (
                  <View style={styles.dragHandle}>
                    <Text style={styles.dragHandleText}>⋮⋮</Text>
                  </View>
                )}
              </Animated.View>

              {/* Drop zone below each item */}
              {renderDropZone(index)}
            </View>
          );
        })}
      </View>

      {/* Score Display */}
      {showCorrectAnswer && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {calculateScore().toFixed(1)}%
          </Text>
        </View>
      )}

      {/* Explanation */}
      {question.explanation && showCorrectAnswer && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>Explanation:</Text>
          <RenderHtml
            contentWidth={screenWidth - 32}
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
    marginBottom: 20,
  },
  instructionContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 12,
    color: '#0369A1',
  },
  orderingContainer: {
    minHeight: 400,
  },
  itemWrapper: {
    position: 'relative',
  },
  dropZone: {
    height: 8,
    marginVertical: 4,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  activeDropZone: {
    borderColor: '#2B5CE6',
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  dropZoneText: {
    fontSize: 12,
    color: '#2B5CE6',
    fontWeight: '600',
  },
  orderingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    minHeight: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  draggedItem: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  positionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  accessibilityControls: {
    flexDirection: 'column',
    marginRight: 8,
  },
  moveButton: {
    width: 32,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginVertical: 1,
  },
  disabledButton: {
    opacity: 0.3,
  },
  moveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  dragHandle: {
    width: 24,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandleText: {
    fontSize: 16,
    color: '#9CA3AF',
    letterSpacing: -2,
  },
  scoreContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  explanationContainer: {
    marginTop: 20,
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

export default OrderingRenderer;
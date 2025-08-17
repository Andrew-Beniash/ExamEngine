import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { useExamSession } from '../../shared/hooks';
import { RepositoryFactory } from '../../data/repositories/RepositoryFactory';
import { Question } from '../../shared/types/database';
import { ExamController } from './domain';
import QuestionPlayer from './components/QuestionPlayer';
import ExamTimer from './components/ExamTimer';
import { useAutoSave } from './hooks/useAutoSave';
import { useMasteryTracking } from './hooks/useMasteryTracking';

const ExamScreen = () => {
  const examSession = useExamSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [masteryFeedback, setMasteryFeedback] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [_showResultsAd, setShowResultsAd] = useState(false);
  const examController = ExamController.getInstance();

  // Initialize mastery tracking
  const {
    trackQuestionAttempt,
    endMasterySession,
    getMasteryFeedback,
    isTrackingEnabled,
  } = useMasteryTracking({
    enableRealTimeTracking: true,
    enableRecommendations: true,
    autoStartLearningSession: true,
  });

  // Enable auto-save functionality
  useAutoSave(questions);

  const loadQuestions = useCallback(async () => {
    try {
      const questionRepo = RepositoryFactory.getQuestionRepository();
      const loadedQuestions = await questionRepo.getByIds(examSession.questions);
      setQuestions(loadedQuestions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  }, [examSession.questions]);

  useEffect(() => {
    if (examSession.isActive && examSession.questions.length > 0) {
      loadQuestions();
    } else {
      setLoading(false);
    }
  }, [examSession.isActive, examSession.questions, loadQuestions]);

  // Track time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [examSession.currentQuestionIndex]);

  const calculateIsCorrect = useCallback((question: Question, selectedIds: string[]): boolean => {
    if (question.type === 'single' || question.type === 'multi') {
      const correctAnswers = question.correct || [];
      if (selectedIds.length !== correctAnswers.length) return false;
      return correctAnswers.every(id => selectedIds.includes(id));
    }
    
    if (question.type === 'order') {
      const correctOrder = question.correctOrder || [];
      if (selectedIds.length !== correctOrder.length) return false;
      return selectedIds.every((id, index) => id === correctOrder[index]);
    }
    
    // For scenario questions, use the same logic as single/multi
    const correctAnswers = question.correct || [];
    if (selectedIds.length !== correctAnswers.length) return false;
    return correctAnswers.every(id => selectedIds.includes(id));
  }, []);

  const handleAnswerChange = useCallback(async (questionIndex: number, selectedIds: string[]) => {
    const timeSpent = Date.now() - questionStartTime;
    const currentQuestion = questions[questionIndex];
    
    if (!currentQuestion) return;

    // Calculate if answer is correct
    const isCorrect = calculateIsCorrect(currentQuestion, selectedIds);
    
    // Update exam session
    examSession.answerCurrentQuestion(selectedIds, timeSpent);
    
    // Track for mastery system
    if (isTrackingEnabled) {
      try {
        await trackQuestionAttempt(currentQuestion, selectedIds, timeSpent, isCorrect);
        
        // Get mastery feedback and show it
        const feedback = getMasteryFeedback(currentQuestion, isCorrect);
        if (feedback && !examSession.isReviewMode) {
          setMasteryFeedback(feedback);
          setShowFeedbackModal(true);
          
          // Auto-hide feedback after 3 seconds
          setTimeout(() => {
            setShowFeedbackModal(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Error tracking mastery:', error);
      }
    }
  }, [
    questionStartTime, 
    questions, 
    examSession, 
    isTrackingEnabled, 
    trackQuestionAttempt, 
    getMasteryFeedback,
    calculateIsCorrect
  ]);

  const handleQuestionChange = (index: number) => {
    examSession.navigateQuestion(index);
  };

  const handleFlag = (questionId: string) => {
    examSession.toggleFlag(questionId);
  };

  const handleBookmark = (questionId: string) => {
    examSession.toggleBookmark(questionId);
  };

  const finishExam = async () => {
    Alert.alert(
      'Finish Exam',
      'Are you sure you want to finish this exam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              // Calculate and show results
              const results = examController.calculateResults(
                examSession.sessionId!,
                questions,
                examSession.answers,
                Date.now() - (examSession.startTime || Date.now())
              );

              // Save to database
              await examController.saveExamAttempt(
                examSession.sessionId!,
                questions,
                examSession.answers,
                examSession.timeSpentPerQuestion,
                examSession.packId || 'sample-pack',
                examSession.templateId || undefined
              );

              // End mastery tracking session
              if (isTrackingEnabled) {
                await endMasterySession();
              }

              // Show results
              Alert.alert(
                'Exam Complete!',
                `Final Score: ${results.score.toFixed(1)}%\n` +
                `Correct: ${results.correctAnswers}/${results.totalQuestions}\n` +
                `Time: ${Math.round(results.timeSpent / 1000 / 60)} minutes\n\n` +
                `🎯 Your proficiency has been updated based on performance!`,
                [
                  {
                    text: 'View Detailed Results',
                    onPress: () => showDetailedResults(results)
                  },
                  {
                    text: 'OK',
                    onPress: () => {}
                  }
                ]
              );

              // End session
              examSession.finishSession();
              
              // Show results ad
              setShowResultsAd(true);
            } catch (error) {
              console.error('Error finishing exam:', error);
              Alert.alert('Error', 'Failed to save results, but exam will end');
              examSession.finishSession();
              
              if (isTrackingEnabled) {
                await endMasterySession();
              }
            }
          }
        }
      ]
    );
  };

  const showDetailedResults = (results: any) => {
    const topicBreakdown = Object.entries(results.perTopicStats)
      .map(([topic, stats]) => {
        const topicStats = stats as { correct: number; total: number; percentage: number };
        return `• ${getTopicDisplayName(topic)}: ${topicStats.percentage.toFixed(0)}% (${topicStats.correct}/${topicStats.total})`;
      })
      .join('\n');

    Alert.alert(
      'Detailed Results',
      `Overall Score: ${results.score.toFixed(1)}%\n\n` +
      `Topic Breakdown:\n${topicBreakdown}\n\n` +
      `📊 Your mastery levels have been updated. Check the Profile tab to see your progress!`
    );
  };

  const startReview = () => {
    examSession.startReview(true);
  };

  const handleTimeExpired = useCallback(async () => {
    Alert.alert(
      'Time Expired!',
      'Your exam time has expired. The exam will be automatically submitted.',
      [{ text: 'OK', onPress: () => {} }]
    );

    try {
      const results = examController.calculateResults(
        examSession.sessionId!,
        questions,
        examSession.answers,
        Date.now() - (examSession.startTime || Date.now())
      );

      await examController.saveExamAttempt(
        examSession.sessionId!,
        questions,
        examSession.answers,
        examSession.timeSpentPerQuestion,
        examSession.packId || 'sample-pack',
        examSession.templateId || undefined
      );

      if (isTrackingEnabled) {
        await endMasterySession();
      }

      examSession.handleTimeExpired();

      setTimeout(() => {
        Alert.alert(
          'Exam Auto-Submitted',
          `Final Score: ${results.score.toFixed(1)}%\n` +
          `Time: Complete\n\n` +
          `🎯 Your mastery data has been updated!`
        );
      }, 1000);
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      examSession.handleTimeExpired();
      
      if (isTrackingEnabled) {
        await endMasterySession();
      }
    }
  }, [examController, examSession, questions, isTrackingEnabled, endMasterySession]);

  const renderMasteryFeedbackModal = () => (
    <Modal
      visible={showFeedbackModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFeedbackModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackContainer}>
          <TouchableOpacity
            style={styles.feedbackCloseButton}
            onPress={() => setShowFeedbackModal(false)}
          >
            <Text style={styles.feedbackCloseText}>×</Text>
          </TouchableOpacity>
          
          <Text style={styles.feedbackTitle}>Mastery Update</Text>
          <Text style={styles.feedbackText}>{masteryFeedback}</Text>
          
          <View style={styles.feedbackFooter}>
            <Text style={styles.feedbackFooterText}>
              Track your progress in the Profile tab
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!examSession.isActive) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>No active exam session</Text>
        <Text style={styles.subtitle}>Start a practice session from the Home tab</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>No questions found</Text>
        <TouchableOpacity style={styles.endButton} onPress={() => examSession.finishSession()}>
          <Text style={styles.buttonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with progress, timer, and controls */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {examSession.currentQuestionIndex + 1} of {examSession.totalQuestions}
          </Text>
          <Text style={styles.answeredText}>
            Answered: {Object.keys(examSession.answers).length}
          </Text>
          {isTrackingEnabled && (
            <Text style={styles.masteryIndicator}>
              🎯 Mastery tracking active
            </Text>
          )}
        </View>

        <View style={styles.timerContainer}>
          <ExamTimer 
            onTimeExpired={handleTimeExpired}
            showWarnings={true}
          />
        </View>
        
        <View style={styles.headerButtons}>
          {!examSession.isReviewMode && (
            <TouchableOpacity style={styles.reviewButton} onPress={startReview}>
              <Text style={styles.reviewButtonText}>Review</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.finishButton} onPress={finishExam}>
            <Text style={styles.finishButtonText}>
              {examSession.isReviewMode ? 'Finish' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Question Player */}
      <QuestionPlayer
        questions={questions}
        currentIndex={examSession.currentQuestionIndex}
        onQuestionChange={handleQuestionChange}
        onAnswerChange={handleAnswerChange}
        answers={examSession.answers}
        flaggedQuestions={new Set(examSession.flaggedQuestions)}
        bookmarkedQuestions={new Set(examSession.bookmarkedQuestions)}
        onFlag={handleFlag}
        onBookmark={handleBookmark}
        isReviewMode={examSession.isReviewMode}
        showCorrectAnswers={examSession.showCorrectAnswers}
      />

      {/* Mastery Feedback Modal */}
      {renderMasteryFeedbackModal()}
    </View>
  );
};

// Helper function
const getTopicDisplayName = (topicId: string): string => {
  const topicNames: Record<string, string> = {
    'planning': 'BA Planning',
    'elicitation': 'Elicitation',
    'requirements-analysis': 'Requirements',
    'traceability': 'Traceability',
    'validation': 'Validation',
    'solution-evaluation': 'Solution Eval',
    'strategy-analysis': 'Strategy',
    'stakeholder-engagement': 'Stakeholders',
    'governance': 'Governance',
    'techniques': 'Techniques',
  };
  return topicNames[topicId] || topicId.replace('-', ' ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressContainer: {
    flex: 1,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  answeredText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  masteryIndicator: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  finishButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  endButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Mastery Feedback Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: '90%',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  feedbackCloseText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  feedbackFooterText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ExamScreen;
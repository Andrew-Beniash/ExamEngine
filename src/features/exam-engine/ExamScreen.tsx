import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useExamSession } from '../../shared/hooks';
import { RepositoryFactory } from '../../data/repositories/RepositoryFactory';
import { Question } from '../../shared/types/database';
import { ExamController } from './domain';
import QuestionPlayer from './components/QuestionPlayer';
import ExamTimer from './components/ExamTimer';
import { useAutoSave } from './hooks/useAutoSave';

const ExamScreen = () => {
  const examSession = useExamSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const examController = ExamController.getInstance();

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

  const handleAnswerChange = (questionIndex: number, selectedIds: string[]) => {
    const timeSpent = Date.now() - questionStartTime;
    examSession.answerCurrentQuestion(selectedIds, timeSpent);
  };

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
                examSession.templateId || undefined // Convert null to undefined
              );

              // Show results
              Alert.alert(
                'Exam Complete!',
                `Final Score: ${results.score.toFixed(1)}%\n` +
                `Correct: ${results.correctAnswers}/${results.totalQuestions}\n` +
                `Time: ${Math.round(results.timeSpent / 1000 / 60)} minutes\n\n` +
                `Topic Breakdown:\n` +
                Object.entries(results.perTopicStats)
                  .map(([topic, stats]) => {
                    const topicStats = stats as { correct: number; total: number; percentage: number };
                    return `${topic}: ${topicStats.percentage.toFixed(0)}%`;
                  })
                  .join('\n')
              );

              // End session
              examSession.finishSession();
            } catch (error) {
              console.error('Error finishing exam:', error);
              Alert.alert('Error', 'Failed to save results, but exam will end');
              examSession.finishSession();
            }
          }
        }
      ]
    );
  };

  const startReview = () => {
    examSession.startReview(true); // Show correct answers in review
  };

  const handleTimeExpired = useCallback(async () => {
    Alert.alert(
      'Time Expired!',
      'Your exam time has expired. The exam will be automatically submitted.',
      [{ text: 'OK', onPress: () => {} }]
    );

    // Auto-submit the exam
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

      examSession.handleTimeExpired();

      // Show final results after a brief delay
      setTimeout(() => {
        Alert.alert(
          'Exam Auto-Submitted',
          `Final Score: ${results.score.toFixed(1)}%\n` +
          `Correct: ${results.correctAnswers}/${results.totalQuestions}\n` +
          `Time: Complete\n\n` +
          `Topic Breakdown:\n` +
          Object.entries(results.perTopicStats)
            .map(([topic, stats]) => {
              const topicStats = stats as { correct: number; total: number; percentage: number };
              return `${topic}: ${topicStats.percentage.toFixed(0)}%`;
            })
            .join('\n')
        );
      }, 1000);
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      examSession.handleTimeExpired();
    }
  }, [examController, examSession, questions]);

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
        </View>

        {/* Timer in the center */}
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
    </View>
  );
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
});

export default ExamScreen;
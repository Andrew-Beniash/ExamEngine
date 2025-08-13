import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QuestionPlayer from '../exam-engine/components/QuestionPlayer';
import { Question } from '../../shared/types/database';

const PracticeScreen = () => {
  const [showQuestionPlayer, setShowQuestionPlayer] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());

  // Sample questions for testing
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      type: 'single',
      stem: '<p>What is the primary purpose of <strong>business analysis planning</strong>?</p>',
      topicIds: ['planning'],
      choices: [
        { id: 'a', text: 'To create detailed project schedules' },
        { id: 'b', text: 'To establish the approach for business analysis activities' },
        { id: 'c', text: 'To write technical specifications' },
        { id: 'd', text: 'To manage project resources' }
      ],
      correct: ['b'],
      difficulty: 'easy',
      explanation: '<p>Business analysis planning establishes the <em>approach and activities</em> for business analysis work throughout the project.</p>',
      packId: 'sample'
    },
    {
      id: 'q2',
      type: 'multi',
      stem: '<p>Which of the following are key stakeholder groups in business analysis? <strong>(Choose two)</strong></p>',
      topicIds: ['elicitation'],
      choices: [
        { id: 'a', text: 'Business users' },
        { id: 'b', text: 'IT developers' },
        { id: 'c', text: 'Project sponsors' },
        { id: 'd', text: 'External vendors' }
      ],
      correct: ['a', 'c'],
      difficulty: 'med',
      explanation: '<p>Business users and project sponsors are <strong>primary stakeholders</strong> that business analysts work with regularly to understand requirements and ensure project success.</p>',
      packId: 'sample'
    },
    {
      id: 'q3',
      type: 'single',
      stem: '<p>In agile development, what is the role of a business analyst during sprint planning?</p>',
      topicIds: ['agile'],
      choices: [
        { id: 'a', text: 'To assign tasks to developers' },
        { id: 'b', text: 'To clarify requirements and acceptance criteria' },
        { id: 'c', text: 'To estimate development effort' },
        { id: 'd', text: 'To test completed features' }
      ],
      correct: ['b'],
      difficulty: 'med',
      explanation: '<p>The BA helps ensure that user stories are well-defined with clear acceptance criteria before development begins.</p>',
      packId: 'sample'
    }
  ];

  const handleAnswerChange = (questionIndex: number, selectedIds: string[]) => {
    const questionId = sampleQuestions[questionIndex].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedIds
    }));
  };

  const handleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleBookmark = (questionId: string) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (showQuestionPlayer) {
    return (
      <QuestionPlayer
        questions={sampleQuestions}
        currentIndex={currentQuestionIndex}
        onQuestionChange={setCurrentQuestionIndex}
        onAnswerChange={handleAnswerChange}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        bookmarkedQuestions={bookmarkedQuestions}
        onFlag={handleFlag}
        onBookmark={handleBookmark}
        isReviewMode={false}
        showCorrectAnswers={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice</Text>
      <Text style={styles.subtitle}>Topic selection, custom settings</Text>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => setShowQuestionPlayer(true)}
      >
        <Text style={styles.startButtonText}>Start Practice Session</Text>
      </TouchableOpacity>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Questions Answered: {Object.keys(answers).length}/{sampleQuestions.length}
        </Text>
        <Text style={styles.statusText}>
          Flagged: {flaggedQuestions.size}
        </Text>
        <Text style={styles.statusText}>
          Bookmarked: {bookmarkedQuestions.size}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#2B5CE6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default PracticeScreen;

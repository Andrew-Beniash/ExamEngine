import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { PackValidator } from '../../data/validation/PackValidator';
import { PackVerifier } from '../../data/verification/PackVerifier';
import { CryptoUtils } from '../../shared/utils/crypto';
import { useExamSession } from '../../shared/hooks';
import { ExamController } from '../exam-engine/domain';

const HomeScreen = () => {
  const [validationResult, setValidationResult] = useState<string>('');
  const [cryptoResult, setCryptoResult] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const examSession = useExamSession();
  const examController = ExamController.getInstance();
  const navigation = useNavigation();

  const testValidation = () => {
    const validator = new PackValidator();
    
    const sampleQuestions = [
      {
        id: 'q1',
        type: 'single' as const,
        stem: 'What is business analysis?',
        topicIds: ['planning'],
        choices: [
          { id: 'a', text: 'Planning projects' },
          { id: 'b', text: 'Analyzing business needs' }
        ],
        correct: ['b'],
        difficulty: 'easy' as const
      }
    ];

    const result = validator.validateQuestions(sampleQuestions);
    setValidationResult(JSON.stringify(result, null, 2));
  };

  const testCrypto = () => {
    try {
      // Test SHA-256
      const testData = 'Hello, World!';
      const hash = CryptoUtils.sha256(testData);
      
      // Test Ed25519 key generation and signing
      const keyPair = CryptoUtils.generateKeyPair();
      const signature = CryptoUtils.signData(testData, keyPair.privateKey);
      const isValid = CryptoUtils.verifySignature(testData, signature, keyPair.publicKey);
      
      // Test pack verification
      const verifier = new PackVerifier();
      const testPackData = Buffer.from('test pack content');
      const checksumResult = verifier.verifyChecksum(testPackData, hash);
      
      const result = {
        sha256: hash,
        keyPair: { 
          publicKey: keyPair.publicKey.substring(0, 16) + '...', 
          privateKey: '[hidden]' 
        },
        signature: signature.substring(0, 16) + '...',
        signatureValid: isValid,
        checksumTest: checksumResult.isValid
      };
      
      setCryptoResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setCryptoResult(`Error: ${error}`);
    }
  };

  const startQuickPractice = async () => {
    setIsStarting(true);
    try {
      // Get questions using ExamController
      const questions = await examController.getQuestionsForExam({
        mode: 'practice',
        packId: 'sample-pack',
        questionCount: 5,
        durationMinutes: 10,
      });

      if (questions.length === 0) {
        Alert.alert('No Questions', 'No questions found. Make sure the database is seeded with sample questions.');
        return;
      }

      // Start exam session with actual question data
      examSession.startExamSession({
        sessionId: `practice_${Date.now()}`,
        packId: 'sample-pack',
        questions: questions.map(q => q.id),
        durationMs: 10 * 60 * 1000, // 10 minutes
      });

      // Navigate to exam screen
      navigation.navigate('Exam' as never);

      Alert.alert(
        'Practice Started!', 
        `Started practice session with ${questions.length} questions`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to start practice session: ${error}`);
      console.error('Failed to start practice:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const startCustomPractice = async () => {
    setIsStarting(true);
    try {
      const questions = await examController.getQuestionsForExam({
        mode: 'custom',
        packId: 'sample-pack',
        topicIds: ['requirements-analysis', 'elicitation'],
        questionCount: 8,
        difficulty: ['med', 'hard'],
        durationMinutes: 15,
      });

      if (questions.length === 0) {
        Alert.alert('No Questions', 'No questions found for the selected criteria.');
        return;
      }

      examSession.startExamSession({
        sessionId: `custom_${Date.now()}`,
        packId: 'sample-pack',
        questions: questions.map(q => q.id),
        durationMs: 15 * 60 * 1000, // 15 minutes
      });

      // Navigate to exam screen
      navigation.navigate('Exam' as never);

      Alert.alert(
        'Custom Practice Started!', 
        `Started with ${questions.length} medium/hard questions`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to start custom practice: ${error}`);
    } finally {
      setIsStarting(false);
    }
  };

  const endCurrentSession = async () => {
    try {
      if (examSession.sessionId && examSession.questions.length > 0) {
        // Get actual question data for results calculation
        const questions = await examController.getQuestionsForExam({
          mode: 'practice',
          packId: examSession.packId || 'sample-pack',
          questionCount: examSession.questions.length,
        });

        // Calculate and display results
        const results = examController.calculateResults(
          examSession.sessionId,
          questions,
          examSession.answers,
          Date.now() - (examSession.startTime || Date.now())
        );

        Alert.alert(
          'Session Results',
          `Score: ${results.score.toFixed(1)}%\n` +
          `Correct: ${results.correctAnswers}/${results.totalQuestions}\n` +
          `Time: ${Math.round(results.timeSpent / 1000 / 60)} minutes`
        );

        // Save to database
        await examController.saveExamAttempt(
          examSession.sessionId,
          questions,
          examSession.answers,
          examSession.timeSpentPerQuestion,
          examSession.packId || 'sample-pack'
        );
      }

      examSession.finishSession();
    } catch (error) {
      console.error('Error ending session:', error);
      examSession.finishSession();
      Alert.alert('Session Ended', 'Session ended (results may not be saved)');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Exam Engine Home</Text>
      <Text style={styles.subtitle}>Start practicing with real questions!</Text>
      
      {/* Exam Session Controls */}
      <View style={styles.sessionContainer}>
        <Text style={styles.sectionTitle}>Practice Sessions</Text>
        
        {!examSession.isActive ? (
          <View>
            <TouchableOpacity 
              style={styles.practiceButton} 
              onPress={startQuickPractice}
              disabled={isStarting}
            >
              <Text style={styles.buttonText}>
                {isStarting ? 'Starting...' : 'Quick Practice (5 questions)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.customButton} 
              onPress={startCustomPractice}
              disabled={isStarting}
            >
              <Text style={styles.buttonText}>
                {isStarting ? 'Starting...' : 'Custom Practice (8 questions)'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.stateText}>✅ Session Active</Text>
            <Text style={styles.stateText}>
              Progress: {examSession.currentQuestionIndex + 1}/{examSession.totalQuestions}
            </Text>
            <Text style={styles.stateText}>
              Answered: {Object.keys(examSession.answers).length} questions
            </Text>
            <Text style={styles.stateText}>
              Flagged: {examSession.flaggedQuestions.length}
            </Text>
            
            <TouchableOpacity style={styles.endButton} onPress={endCurrentSession}>
              <Text style={styles.buttonText}>End Session & See Results</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Debug/Test Controls */}
      <View style={styles.debugContainer}>
        <Text style={styles.sectionTitle}>Debug & Testing</Text>
        
        <TouchableOpacity style={styles.button} onPress={testValidation}>
          <Text style={styles.buttonText}>Test Pack Validation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.cryptoButton]} onPress={testCrypto}>
          <Text style={styles.buttonText}>Test Crypto & Verification</Text>
        </TouchableOpacity>
      </View>
      
      {validationResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Validation Result:</Text>
          <Text style={styles.resultText}>{validationResult}</Text>
        </View>
      ) : null}

      {cryptoResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Crypto Test Result:</Text>
          <Text style={styles.resultText}>{cryptoResult}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  sessionContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  debugContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  stateText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#374151',
  },
  practiceButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  customButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  endButton: {
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  button: {
    backgroundColor: '#2B5CE6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  cryptoButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  resultTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#374151',
  },
});

export default HomeScreen;
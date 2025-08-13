import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Buffer } from 'buffer';
import { PackValidator } from '../../data/validation/PackValidator';
import { PackVerifier } from '../../data/verification/PackVerifier';
import { CryptoUtils } from '../../shared/utils/crypto';
import { useExamSession } from '../../shared/hooks';
import { RepositoryFactory } from '../../data/repositories/RepositoryFactory';

const HomeScreen = () => {
  const [validationResult, setValidationResult] = useState<string>('');
  const [cryptoResult, setCryptoResult] = useState<string>('');
  const examSession = useExamSession();

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

  const startPracticeSession = async () => {
    try {
      // Get sample questions from repository
      const questionRepo = RepositoryFactory.getQuestionRepository();
      const sampleQuestions = await questionRepo.sampleQuestions({
        topicIds: ['planning', 'elicitation'], // Any topics
        limit: 5, // Start with 5 questions
      });

      if (sampleQuestions.length === 0) {
        Alert.alert('No Questions', 'No questions found. Please install a content pack first.');
        return;
      }

      // Start exam session
      examSession.startExamSession({
        sessionId: `practice_${Date.now()}`,
        packId: 'sample',
        questions: sampleQuestions.map(q => q.id),
        durationMs: 10 * 60 * 1000, // 10 minutes
      });

      Alert.alert('Session Started', `Practice session started with ${sampleQuestions.length} questions`);
    } catch (error) {
      Alert.alert('Error', `Failed to start practice session: ${error}`);
    }
  };

  const endCurrentSession = () => {
    examSession.finishSession();
    Alert.alert('Session Ended', 'Practice session has been ended');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Mode selection, continue exam, quick start</Text>
      
      {/* Redux State Testing */}
      <View style={styles.sessionContainer}>
        <Text style={styles.sectionTitle}>Exam Session State</Text>
        <Text style={styles.stateText}>
          Active: {examSession.isActive ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.stateText}>
          Questions: {examSession.totalQuestions}
        </Text>
        <Text style={styles.stateText}>
          Current: {examSession.currentQuestionIndex + 1}
        </Text>
        <Text style={styles.stateText}>
          Answers: {Object.keys(examSession.answers).length}
        </Text>
        
        {!examSession.isActive ? (
          <TouchableOpacity style={styles.startButton} onPress={startPracticeSession}>
            <Text style={styles.buttonText}>Start Practice Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endButton} onPress={endCurrentSession}>
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={testValidation}>
        <Text style={styles.buttonText}>Test Pack Validation</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.cryptoButton]} onPress={testCrypto}>
        <Text style={styles.buttonText}>Test Crypto & Verification</Text>
      </TouchableOpacity>
      
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
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stateText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
  },
  startButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  endButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  button: {
    backgroundColor: '#2B5CE6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  cryptoButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
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
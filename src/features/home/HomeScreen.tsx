import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Buffer } from 'buffer';
import { PackValidator } from '../../data/validation/PackValidator';
import { PackVerifier } from '../../data/verification/PackVerifier';
import { CryptoUtils } from '../../shared/utils/crypto';

const HomeScreen = () => {
  const [validationResult, setValidationResult] = useState<string>('');
  const [cryptoResult, setCryptoResult] = useState<string>('');

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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Mode selection, continue exam, quick start</Text>
      
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
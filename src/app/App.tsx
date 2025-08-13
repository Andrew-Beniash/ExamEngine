import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import TabNavigator from './navigation/TabNavigator';
import DatabaseManager from '../data/database/DatabaseManager';
import { RepositoryFactory } from '../data/repositories/RepositoryFactory';
import { CryptoUtils } from '../shared/utils/crypto';
import { SecureStorage } from '../data/storage/SecureStorage';
import { store } from './store';

const AppContent = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize crypto
      await CryptoUtils.initialize();
      console.log('Crypto initialized');
      
      // Initialize secure storage
      const secureStorage = SecureStorage.getInstance();
      const deviceGuid = secureStorage.getDeviceGuid();
      console.log('Device GUID:', deviceGuid);

      // Initialize database
      const dbManager = DatabaseManager.getInstance();
      await dbManager.initialize();
      
      // Initialize repositories
      const db = dbManager.getDatabase();
      RepositoryFactory.initializeRepositories(db);
      
      setIsReady(true);
      console.log('App initialized successfully');
    } catch (err) {
      console.error('App initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown initialization error');
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorDetails}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Initializing App...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default App;
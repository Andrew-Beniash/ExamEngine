import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TipsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tips</Text>
      <Text style={styles.subtitle}>Searchable offline content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  },
});

export default TipsScreen;

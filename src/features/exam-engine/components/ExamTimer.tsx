import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { useExamSession } from '../../../shared/hooks';

interface ExamTimerProps {
  onTimeExpired?: () => void;
  showWarnings?: boolean;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ 
  onTimeExpired, 
  showWarnings = true 
}) => {
  const examSession = useExamSession();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isWarningShown, setIsWarningShown] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Calculate time left based on exam session
  useEffect(() => {
    if (examSession.remainingTimeMs !== null) {
      setTimeLeft(examSession.remainingTimeMs);
    }
  }, [examSession.remainingTimeMs]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (backgroundTimeRef.current && examSession.isTimerRunning) {
          const backgroundDuration = Date.now() - backgroundTimeRef.current;
          const newTimeLeft = Math.max(0, timeLeft - backgroundDuration);
          setTimeLeft(newTimeLeft);
          examSession.updateTimer(newTimeLeft);
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        backgroundTimeRef.current = Date.now();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [timeLeft, examSession]);

  // Timer countdown logic
  useEffect(() => {
    if (examSession.isTimerRunning && examSession.isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = Math.max(0, prevTime - 1000);
          examSession.updateTimer(newTime);
          
          // Show warning at 5 minutes
          if (showWarnings && newTime <= 5 * 60 * 1000 && !isWarningShown && newTime > 0) {
            setIsWarningShown(true);
            // Could show an alert or toast here
          }
          
          // Time expired
          if (newTime === 0) {
            onTimeExpired?.();
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [examSession.isTimerRunning, examSession.isActive, timeLeft, onTimeExpired, showWarnings, isWarningShown, examSession]);

  // Don't show timer if no time limit set
  if (examSession.remainingTimeMs === null || !examSession.isActive) {
    return null;
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerStyle = () => {
    if (timeLeft <= 5 * 60 * 1000) { // Last 5 minutes
      return [styles.timerText, styles.warningText];
    }
    if (timeLeft <= 15 * 60 * 1000) { // Last 15 minutes
      return [styles.timerText, styles.cautionText];
    }
    return styles.timerText;
  };

  const getTimerIcon = () => {
    if (timeLeft <= 5 * 60 * 1000) {
      return '🔴'; // Red circle for danger
    }
    if (timeLeft <= 15 * 60 * 1000) {
      return '🟡'; // Yellow circle for caution
    }
    return '⏱️'; // Timer icon for normal
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerIcon}>{getTimerIcon()}</Text>
        <Text style={getTimerStyle()}>
          {formatTime(timeLeft)}
        </Text>
      </View>
      {timeLeft <= 5 * 60 * 1000 && timeLeft > 0 && (
        <Text style={styles.warningLabel}>Time Warning!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'monospace',
  },
  cautionText: {
    color: '#F59E0B',
  },
  warningText: {
    color: '#EF4444',
  },
  warningLabel: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ExamTimer;
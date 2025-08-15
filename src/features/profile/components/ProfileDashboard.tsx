import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { UserPreferencesRepository, ProfileStats, TopicProficiency } from '../../../data/repositories/UserPreferencesRepository';

const { width: screenWidth } = Dimensions.get('window');

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

const ProfileDashboard: React.FC = () => {
  const [profileStats, setProfileStats] = useState<ProfileStats>(
    UserPreferencesRepository.getProfileStats()
  );
  const [topicProficiencies, setTopicProficiencies] = useState<TopicProficiency[]>(
    UserPreferencesRepository.getTopicProficiencies()
  );

  useEffect(() => {
    // Refresh data when component mounts
    setProfileStats(UserPreferencesRepository.getProfileStats());
    setTopicProficiencies(UserPreferencesRepository.getTopicProficiencies());
  }, []);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⭐';
    return '📚';
  };

  const getProficiencyColor = (proficiency: number): string => {
    if (proficiency >= 0.8) return '#059669'; // Green
    if (proficiency >= 0.6) return '#D97706'; // Orange
    if (proficiency >= 0.4) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  };

  const getProficiencyLabel = (proficiency: number): string => {
    if (proficiency >= 0.8) return 'Mastered';
    if (proficiency >= 0.6) return 'Proficient';
    if (proficiency >= 0.4) return 'Learning';
    return 'Needs Work';
  };

  const statCards: StatCard[] = [
    {
      title: 'Current Streak',
      value: `${profileStats.currentStreak}`,
      subtitle: `Best: ${profileStats.longestStreak} days`,
      icon: getStreakEmoji(profileStats.currentStreak),
      color: '#059669',
    },
    {
      title: 'Practice Time',
      value: formatTime(profileStats.totalPracticeTime),
      subtitle: `${profileStats.totalQuestionsAnswered} questions`,
      icon: '📚',
      color: '#2B5CE6',
    },
    {
      title: 'Average Score',
      value: `${Math.round(profileStats.averageScore)}%`,
      subtitle: `${profileStats.totalExamsCompleted} exams completed`,
      icon: '🎯',
      color: '#7C3AED',
    },
    {
      title: 'Last Practice',
      value: formatDate(profileStats.lastPracticeDate),
      subtitle: `Joined ${formatDate(profileStats.joinedDate)}`,
      icon: '⏰',
      color: '#DC2626',
    },
  ];

  const topicNames: Record<string, string> = {
    'planning': 'Business Analysis Planning',
    'elicitation': 'Requirements Elicitation',
    'analysis': 'Requirements Analysis',
    'traceability': 'Requirements Traceability',
    'validation': 'Requirements Validation',
    'solution-evaluation': 'Solution Evaluation',
    'strategy': 'Strategy Analysis',
    'governance': 'BA Governance',
    'stakeholder': 'Stakeholder Engagement',
    'techniques': 'BA Techniques',
  };

  const renderStatCard = (stat: StatCard, _index: number) => (
    <View key={_index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{stat.icon}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
    </View>
  );

  const renderTopicProficiency = (topic: TopicProficiency, _index: number) => {
    const proficiencyPercentage = Math.round(topic.proficiency * 100);
    const color = getProficiencyColor(topic.proficiency);
    const label = getProficiencyLabel(topic.proficiency);
    
    return (
      <View key={topic.topicId} style={styles.topicItem}>
        <View style={styles.topicHeader}>
          <Text style={styles.topicName}>
            {topicNames[topic.topicId] || topic.topicId}
          </Text>
          <View style={[styles.proficiencyBadge, { backgroundColor: color }]}>
            <Text style={styles.proficiencyBadgeText}>{label}</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${proficiencyPercentage}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{proficiencyPercentage}%</Text>
        </View>
        
        <View style={styles.topicStats}>
          <Text style={styles.topicStat}>
            {topic.correctAnswers}/{topic.totalQuestions} correct
          </Text>
          <Text style={styles.topicStat}>
            Last practiced: {formatDate(topic.lastPracticed)}
          </Text>
        </View>
        
        {topic.improvementTrend !== 'stable' && (
          <View style={styles.trendContainer}>
            <Text style={[
              styles.trendText,
              topic.improvementTrend === 'improving' ? styles.trendImproving : styles.trendDeclining
            ]}>
              {topic.improvementTrend === 'improving' ? '📈 Improving' : '📉 Needs attention'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📊</Text>
      <Text style={styles.emptyStateTitle}>Start Practicing to See Progress</Text>
      <Text style={styles.emptyStateSubtitle}>
        Complete practice sessions and exams to track your mastery across different topics
      </Text>
      <TouchableOpacity style={styles.startPracticeButton}>
        <Text style={styles.startPracticeButtonText}>Start Practicing</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAchievements = () => {
    const achievements = [];
    
    // Streak achievements
    if (profileStats.currentStreak >= 7) {
      achievements.push({ id: 'week-streak', title: 'Week Warrior', icon: '🔥', description: '7-day practice streak' });
    }
    if (profileStats.currentStreak >= 30) {
      achievements.push({ id: 'month-streak', title: 'Monthly Master', icon: '🏆', description: '30-day practice streak' });
    }
    
    // Question achievements
    if (profileStats.totalQuestionsAnswered >= 100) {
      achievements.push({ id: 'century', title: 'Century Club', icon: '💯', description: '100+ questions answered' });
    }
    if (profileStats.totalQuestionsAnswered >= 1000) {
      achievements.push({ id: 'millennium', title: 'Question Master', icon: '🎓', description: '1000+ questions answered' });
    }
    
    // Score achievements
    if (profileStats.averageScore >= 80) {
      achievements.push({ id: 'high-scorer', title: 'High Achiever', icon: '⭐', description: '80%+ average score' });
    }
    
    if (achievements.length === 0) {
      return null;
    }

    return (
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>
          Track your learning journey and mastery
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {statCards.map(renderStatCard)}
      </View>

      {/* Achievements */}
      {renderAchievements()}

      {/* Topic Proficiencies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Topic Mastery</Text>
        {topicProficiencies.length > 0 ? (
          <View style={styles.topicsContainer}>
            {topicProficiencies
              .sort((a, b) => b.proficiency - a.proficiency)
              .map(renderTopicProficiency)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Study Insights */}
      {profileStats.totalQuestionsAnswered > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Study Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Best Study Day</Text>
              <Text style={styles.insightValue}>Weekdays</Text>
              <Text style={styles.insightSubtitle}>You perform 15% better on weekdays</Text>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Optimal Session Length</Text>
              <Text style={styles.insightValue}>25-30 min</Text>
              <Text style={styles.insightSubtitle}>Peak performance window</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  topicsContainer: {
    gap: 16,
  },
  topicItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  proficiencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proficiencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
    textAlign: 'right',
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topicStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendContainer: {
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendImproving: {
    color: '#059669',
  },
  trendDeclining: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  startPracticeButton: {
    backgroundColor: '#2B5CE6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startPracticeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementsSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCard: {
    width: 120,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  insightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileDashboard;
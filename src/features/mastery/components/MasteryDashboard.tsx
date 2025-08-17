import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { TopicProficiency, WeakArea, PracticeRecommendation } from '../../../shared/types/mastery';
import { useMastery } from '../hooks/index';


interface MasteryDashboardProps {
  onStartPractice?: (topicIds: string[], difficulty?: string) => void;
  onViewDetails?: (topicId: string) => void;
}

const MasteryDashboard: React.FC<MasteryDashboardProps> = ({
  onStartPractice,
  onViewDetails,
}) => {
  const {
    proficiencies,
    weakAreas,
    recommendations,
    overallStats,
    isLoading,
    refreshMasteryData,
    followRecommendation,
  } = useMastery();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMasteryData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshMasteryData]);

  const handleStartWeakAreaPractice = useCallback(() => {
    if (weakAreas.length === 0) {
      Alert.alert('No Weak Areas', 'Great job! You don\'t have any weak areas right now.');
      return;
    }

    const topicIds = weakAreas.slice(0, 3).map((wa: WeakArea) => wa.topicId);
    onStartPractice?.(topicIds, 'adaptive');
  }, [weakAreas, onStartPractice]);

  const handleFollowRecommendation = useCallback(async (recommendation: PracticeRecommendation) => {
    try {
      await followRecommendation(recommendation.id);
      onStartPractice?.(recommendation.topicIds, recommendation.difficulty);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recommended practice session');
    }
  }, [followRecommendation, onStartPractice]);

  const renderOverallStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Your Progress</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{overallStats.totalTopics}</Text>
          <Text style={styles.statLabel}>Topics Studied</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.masteredColor]}>
            {overallStats.masteredTopics}
          </Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.weakColor]}>
            {overallStats.weakAreas}
          </Text>
          <Text style={styles.statLabel}>Need Work</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{overallStats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.overallProficiencyContainer}>
        <Text style={styles.overallProficiencyLabel}>Overall Proficiency</Text>
        <View style={styles.proficiencyBarContainer}>
          <View 
            style={[
              styles.proficiencyBar, 
              { width: `${overallStats.averageProficiency * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.proficiencyPercentage}>
          {(overallStats.averageProficiency * 100).toFixed(1)}%
        </Text>
      </View>
    </View>
  );

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>🎯 Recommended Practice</Text>
        
        {recommendations.slice(0, 3).map((rec: PracticeRecommendation) => (
          <TouchableOpacity
            key={rec.id}
            style={styles.recommendationCard}
            onPress={() => handleFollowRecommendation(rec)}
          >
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <View style={[styles.priorityBadge, getPriorityBadgeStyle(rec.priority)]}>
                <Text style={styles.priorityText}>{getPriorityLabel(rec.priority)}</Text>
              </View>
            </View>
            
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
            
            <View style={styles.recommendationStats}>
              <Text style={styles.recommendationStat}>
                📝 {rec.questionCount} questions
              </Text>
              <Text style={styles.recommendationStat}>
                ⏱️ {rec.estimatedDuration} min
              </Text>
              <Text style={styles.recommendationStat}>
                📈 +{(rec.expectedImpact.proficiencyGain * 100).toFixed(0)}% gain
              </Text>
            </View>
            
            <Text style={styles.recommendationReasoning}>{rec.reasoning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderWeakAreas = () => {
    if (weakAreas.length === 0) {
      return (
        <View style={styles.noWeakAreasContainer}>
          <Text style={styles.celebrationIcon}>🎉</Text>
          <Text style={styles.celebrationTitle}>Excellent Work!</Text>
          <Text style={styles.celebrationSubtitle}>
            You don't have any weak areas right now. Keep up the great work!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.weakAreasContainer}>
        <View style={styles.weakAreasHeader}>
          <Text style={styles.sectionTitle}>🔍 Areas Needing Attention</Text>
          <TouchableOpacity 
            style={styles.practiceButton}
            onPress={handleStartWeakAreaPractice}
          >
            <Text style={styles.practiceButtonText}>Practice Now</Text>
          </TouchableOpacity>
        </View>
        
        {weakAreas.slice(0, 5).map((weakArea: WeakArea) => (
          <TouchableOpacity
            key={weakArea.topicId}
            style={styles.weakAreaCard}
            onPress={() => onViewDetails?.(weakArea.topicId)}
          >
            <View style={styles.weakAreaHeader}>
              <Text style={styles.weakAreaTopic}>
                {getTopicDisplayName(weakArea.topicId)}
              </Text>
              <View style={[styles.priorityDot, getPriorityDotStyle(weakArea.priority)]} />
            </View>
            
            <View style={styles.weakAreaStats}>
              <View style={styles.proficiencyMeter}>
                <View 
                  style={[
                    styles.proficiencyFill, 
                    { width: `${weakArea.proficiency * 100}%` },
                    getProficiencyFillStyle(weakArea.proficiency)
                  ]} 
                />
              </View>
              <Text style={styles.proficiencyText}>
                {(weakArea.proficiency * 100).toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.weakAreaDetails}>
              <Text style={styles.weakAreaReason}>
                {getReasonDisplayText(weakArea.reasonCode)}
              </Text>
              <Text style={styles.weakAreaRecommendation}>
                {weakArea.recommendedQuestions} questions • {weakArea.estimatedStudyTime} min
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProficiencyHeatmap = () => {
    if (proficiencies.length === 0) return null;

    // Group proficiencies into rows for heatmap display
    const itemsPerRow = 3;
    const rows: TopicProficiency[][] = [];
    
    for (let i = 0; i < proficiencies.length; i += itemsPerRow) {
      rows.push(proficiencies.slice(i, i + itemsPerRow));
    }

    return (
      <View style={styles.heatmapContainer}>
        <Text style={styles.sectionTitle}>🌡️ Topic Proficiency Map</Text>
        
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.heatmapRow}>
            {row.map((prof) => (
              <TouchableOpacity
                key={prof.topicId}
                style={[
                  styles.heatmapCell,
                  getHeatmapCellStyle(prof.proficiency)
                ]}
                onPress={() => onViewDetails?.(prof.topicId)}
              >
                <Text style={styles.heatmapLabel} numberOfLines={2}>
                  {getTopicDisplayName(prof.topicId)}
                </Text>
                <Text style={styles.heatmapValue}>
                  {(prof.proficiency * 100).toFixed(0)}%
                </Text>
                <View style={styles.confidenceIndicator}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.confidenceDot,
                        i < prof.confidence * 3 && styles.confidenceDotActive
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Fill empty cells in last row */}
            {row.length < itemsPerRow && 
              Array.from({ length: itemsPerRow - row.length }, (_, i) => (
                <View key={`empty-${i}`} style={[styles.heatmapCell, styles.emptyCellStyle]} />
              ))
            }
          </View>
        ))}
      </View>
    );
  };

  if (isLoading && proficiencies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your mastery data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#2B5CE6']}
          tintColor="#2B5CE6"
        />
      }
    >
      {renderOverallStats()}
      {renderRecommendations()}
      {renderWeakAreas()}
      {renderProficiencyHeatmap()}
    </ScrollView>
  );
};

// Helper functions
const getPriorityBadgeStyle = (priority: number) => {
  if (priority >= 80) return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
  if (priority >= 60) return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
  return { backgroundColor: '#EBF4FF', borderColor: '#2B5CE6' };
};

const getPriorityLabel = (priority: number) => {
  if (priority >= 80) return 'High';
  if (priority >= 60) return 'Medium';
  return 'Low';
};

const getPriorityDotStyle = (priority: number) => {
  if (priority >= 80) return { backgroundColor: '#EF4444' };
  if (priority >= 60) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#2B5CE6' };
};

const getProficiencyFillStyle = (proficiency: number) => {
  if (proficiency >= 0.8) return { backgroundColor: '#059669' };
  if (proficiency >= 0.6) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#EF4444' };
};

const getHeatmapCellStyle = (proficiency: number) => {
  const opacity = Math.max(0.3, proficiency);
  if (proficiency >= 0.8) return { backgroundColor: `rgba(5, 150, 105, ${opacity})` };
  if (proficiency >= 0.6) return { backgroundColor: `rgba(245, 158, 11, ${opacity})` };
  return { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
};

const getReasonDisplayText = (reasonCode: string) => {
  switch (reasonCode) {
    case 'low_proficiency': return 'Low proficiency score';
    case 'declining_trend': return 'Performance declining';
    case 'error_prone': return 'Frequent mistakes';
    case 'needs_practice': return 'Due for review';
    default: return 'Needs attention';
  }
};

const getTopicDisplayName = (topicId: string) => {
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
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  
  // Overall Stats
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  masteredColor: {
    color: '#059669',
  },
  weakColor: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  overallProficiencyContainer: {
    alignItems: 'center',
  },
  overallProficiencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  proficiencyBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  proficiencyBar: {
    height: '100%',
    backgroundColor: '#2B5CE6',
    borderRadius: 6,
  },
  proficiencyPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B5CE6',
  },

  // Recommendations
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2B5CE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationReasoning: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Weak Areas
  weakAreasContainer: {
    marginBottom: 20,
  },
  weakAreasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  practiceButton: {
    backgroundColor: '#2B5CE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  practiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noWeakAreasContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  weakAreaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weakAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weakAreaTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weakAreaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proficiencyMeter: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  proficiencyFill: {
    height: '100%',
    borderRadius: 4,
  },
  proficiencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
    textAlign: 'right',
  },
  weakAreaDetails: {
    gap: 4,
  },
  weakAreaReason: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  weakAreaRecommendation: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Heatmap
  heatmapContainer: {
    marginBottom: 20,
  },
  heatmapRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 100,
  },
  emptyCellStyle: {
    backgroundColor: 'transparent',
  },
  heatmapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heatmapValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    gap: 2,
  },
  confidenceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  confidenceDotActive: {
    backgroundColor: '#FFFFFF',
  },
});

export default MasteryDashboard;
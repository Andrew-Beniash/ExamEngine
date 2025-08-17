import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  
} from 'react-native';
import { PracticeRecommendation } from '../../../shared/types/mastery';
import { useMastery } from '../hooks/useMastery';



interface PracticeRecommendationsProps {
  onStartPractice?: (topicIds: string[], difficulty: string, recommendationId?: string) => void;
  showWeakAreasOnly?: boolean;
  maxRecommendations?: number;
}

const PracticeRecommendations: React.FC<PracticeRecommendationsProps> = ({
  onStartPractice,
  showWeakAreasOnly = false,
  maxRecommendations = 5,
}) => {
  const {
    recommendations,
    weakAreas,
    followRecommendation,
    isLoading,
  } = useMastery();

  const [selectedRecommendation, setSelectedRecommendation] = useState<PracticeRecommendation | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const filteredRecommendations = showWeakAreasOnly 
    ? recommendations.filter(rec => rec.type === 'weak_areas')
    : recommendations;

  const displayedRecommendations = filteredRecommendations.slice(0, maxRecommendations);

  const handleRecommendationPress = useCallback((recommendation: PracticeRecommendation) => {
    setSelectedRecommendation(recommendation);
    setIsModalVisible(true);
  }, []);

  const handleStartRecommendedPractice = useCallback(async () => {
    if (!selectedRecommendation) return;

    try {
      await followRecommendation(selectedRecommendation.id);
      onStartPractice?.(
        selectedRecommendation.topicIds, 
        selectedRecommendation.difficulty,
        selectedRecommendation.id
      );
      setIsModalVisible(false);
      setSelectedRecommendation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to start practice session. Please try again.');
    }
  }, [selectedRecommendation, followRecommendation, onStartPractice]);

  const handleStartWeakAreaPractice = useCallback(() => {
    if (weakAreas.length === 0) {
      Alert.alert(
        'No Weak Areas',
        'Great job! You don\'t have any weak areas that need immediate attention.',
        [{ text: 'OK' }]
      );
      return;
    }

    const topWeakAreas = weakAreas.slice(0, 3);
    const topicIds = topWeakAreas.map(wa => wa.topicId);
    
    Alert.alert(
      'Focus Practice',
      `Start a focused practice session on your ${topWeakAreas.length} weakest areas?\n\n` +
      `Topics: ${topWeakAreas.map(wa => getTopicDisplayName(wa.topicId)).join(', ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Practice', 
          onPress: () => onStartPractice?.(topicIds, 'adaptive')
        }
      ]
    );
  }, [weakAreas, onStartPractice]);

  const renderRecommendationCard = (recommendation: PracticeRecommendation) => (
    <TouchableOpacity
      key={recommendation.id}
      style={[styles.recommendationCard, getRecommendationCardStyle(recommendation.type)]}
      onPress={() => handleRecommendationPress(recommendation)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.recommendationIcon}>
            {getRecommendationIcon(recommendation.type)}
          </Text>
          <Text style={styles.recommendationTitle} numberOfLines={2}>
            {recommendation.title}
          </Text>
        </View>
        <View style={[styles.priorityBadge, getPriorityBadgeStyle(recommendation.priority)]}>
          <Text style={[styles.priorityText, getPriorityTextStyle(recommendation.priority)]}>
            {getPriorityLabel(recommendation.priority)}
          </Text>
        </View>
      </View>

      <Text style={styles.recommendationDescription} numberOfLines={2}>
        {recommendation.description}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statText}>{recommendation.questionCount} questions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statText}>{recommendation.estimatedDuration} min</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📈</Text>
          <Text style={styles.statText}>
            +{(recommendation.expectedImpact.proficiencyGain * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.topicsContainer}>
        <Text style={styles.topicsLabel}>Topics:</Text>
        <View style={styles.topicsList}>
          {recommendation.topicIds.slice(0, 3).map((topicId) => (
            <View key={topicId} style={styles.topicChip}>
              <Text style={styles.topicChipText} numberOfLines={1}>
                {getTopicDisplayName(topicId)}
              </Text>
            </View>
          ))}
          {recommendation.topicIds.length > 3 && (
            <View style={styles.topicChip}>
              <Text style={styles.topicChipText}>
                +{recommendation.topicIds.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.quickActionsTitle}>Quick Practice</Text>
      
      <View style={styles.quickActionsRow}>
        <TouchableOpacity 
          style={[styles.quickActionButton, styles.weakAreasButton]}
          onPress={handleStartWeakAreaPractice}
        >
          <Text style={styles.quickActionIcon}>🎯</Text>
          <Text style={styles.quickActionText}>Weak Areas</Text>
          <Text style={styles.quickActionSubtext}>{weakAreas.length} topics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickActionButton, styles.reviewButton]}
          onPress={() => onStartPractice?.([], 'med')}
        >
          <Text style={styles.quickActionIcon}>🔄</Text>
          <Text style={styles.quickActionText}>Spaced Review</Text>
          <Text style={styles.quickActionSubtext}>Due topics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickActionButton, styles.challengeButton]}
          onPress={() => onStartPractice?.([], 'hard')}
        >
          <Text style={styles.quickActionIcon}>⚡</Text>
          <Text style={styles.quickActionText}>Challenge</Text>
          <Text style={styles.quickActionSubtext}>Hard mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Practice Details</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartRecommendedPractice}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {selectedRecommendation && (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalRecommendationHeader}>
              <Text style={styles.modalRecommendationIcon}>
                {getRecommendationIcon(selectedRecommendation.type)}
              </Text>
              <Text style={styles.modalRecommendationTitle}>
                {selectedRecommendation.title}
              </Text>
            </View>

            <Text style={styles.modalRecommendationDescription}>
              {selectedRecommendation.description}
            </Text>

            <View style={styles.modalStatsContainer}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>{selectedRecommendation.questionCount}</Text>
                <Text style={styles.modalStatLabel}>Questions</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>{selectedRecommendation.estimatedDuration}</Text>
                <Text style={styles.modalStatLabel}>Minutes</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>
                  {(selectedRecommendation.expectedImpact.proficiencyGain * 100).toFixed(0)}%
                </Text>
                <Text style={styles.modalStatLabel}>Expected Gain</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Why This Practice?</Text>
              <Text style={styles.modalReasoning}>{selectedRecommendation.reasoning}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Topics Covered</Text>
              <View style={styles.modalTopicsList}>
                {selectedRecommendation.topicIds.map(topicId => (
                  <View key={topicId} style={styles.modalTopicChip}>
                    <Text style={styles.modalTopicChipText}>
                      {getTopicDisplayName(topicId)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Difficulty Level</Text>
              <View style={styles.difficultyIndicator}>
                <Text style={styles.difficultyText}>
                  {selectedRecommendation.difficulty.charAt(0).toUpperCase() + 
                   selectedRecommendation.difficulty.slice(1)}
                </Text>
                <View style={styles.difficultyDots}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.difficultyDot,
                        i < getDifficultyLevel(selectedRecommendation.difficulty) && styles.difficultyDotActive
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading practice recommendations...</Text>
      </View>
    );
  }

  if (displayedRecommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>No Recommendations</Text>
        <Text style={styles.emptySubtitle}>
          Practice more questions to get personalized recommendations
        </Text>
        {renderQuickActions()}
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {!showWeakAreasOnly && renderQuickActions()}
      
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>
          {showWeakAreasOnly ? '🎯 Focus Areas' : '💡 Recommended Practice'}
        </Text>
        
        {displayedRecommendations.map(renderRecommendationCard)}
      </View>

      {renderDetailModal()}
    </ScrollView>
  );
};

// Helper functions
const getRecommendationIcon = (type: string): string => {
  switch (type) {
    case 'weak_areas': return '🎯';
    case 'spaced_review': return '🔄';
    case 'challenge': return '⚡';
    case 'maintenance': return '🛠️';
    default: return '📝';
  }
};

const getRecommendationCardStyle = (type: string) => {
  switch (type) {
    case 'weak_areas':
      return { borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' };
    case 'spaced_review':
      return { borderLeftColor: '#F59E0B', backgroundColor: '#FFFBEB' };
    case 'challenge':
      return { borderLeftColor: '#7C3AED', backgroundColor: '#FAF5FF' };
    default:
      return { borderLeftColor: '#2B5CE6', backgroundColor: '#F0F9FF' };
  }
};

const getPriorityBadgeStyle = (priority: number) => {
  if (priority >= 80) return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
  if (priority >= 60) return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
  return { backgroundColor: '#EBF4FF', borderColor: '#2B5CE6' };
};

const getPriorityTextStyle = (priority: number) => {
  if (priority >= 80) return { color: '#EF4444' };
  if (priority >= 60) return { color: '#F59E0B' };
  return { color: '#2B5CE6' };
};

const getPriorityLabel = (priority: number): string => {
  if (priority >= 80) return 'High';
  if (priority >= 60) return 'Medium';
  return 'Low';
};

const getDifficultyLevel = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': return 2;
    case 'med': return 3;
    case 'hard': return 4;
    case 'adaptive': return 3;
    default: return 3;
  }
};

const getTopicDisplayName = (topicId: string): string => {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weakAreasButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  challengeButton: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Recommendations
  recommendationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  recommendationCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
    lineHeight: 22,
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
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  topicsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  topicsList: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 4,
  },
  topicChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 80,
  },
  topicChipText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  startButton: {
    backgroundColor: '#2B5CE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalRecommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRecommendationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  modalRecommendationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
    lineHeight: 32,
  },
  modalRecommendationDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  modalReasoning: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  modalTopicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTopicChip: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalTopicChipText: {
    fontSize: 14,
    color: '#2B5CE6',
    fontWeight: '500',
  },
  difficultyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  difficultyDots: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  difficultyDotActive: {
    backgroundColor: '#2B5CE6',
  },
});

export default PracticeRecommendations;
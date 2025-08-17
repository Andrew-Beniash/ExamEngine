import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import ProfileDashboard from './components/ProfileDashboard';
import SettingsScreen from './components/SettingsScreen';
import ContentPackManagement from './components/ContentPackManagement';
import MasteryDashboard from '../mastery/components/MasteryDashboard';
import PracticeRecommendations from '../mastery/components/PracticeRecommendations';
import { useMastery } from '../mastery/hooks/useMastery';

type TabType = 'overview' | 'mastery' | 'recommendations' | 'settings' | 'content';

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  const { proficiencies } = useMastery();

  const handleStartPractice = useCallback((
    topicIds: string[], 
    difficulty: string = 'adaptive', 
    recommendationId?: string
  ) => {
    // Navigate to practice screen with parameters
    Alert.alert(
      'Start Practice Session',
      `Starting practice with ${topicIds.length} topics in ${difficulty} mode.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Start',
          onPress: () => {
            // TODO: Navigate to practice screen with parameters
            // navigation.navigate('Practice', { 
            //   topicIds, 
            //   difficulty, 
            //   recommendationId 
            // });
            console.log('Starting practice:', { topicIds, difficulty, recommendationId });
          }
        }
      ]
    );
  }, []);

  const handleViewTopicDetails = useCallback(async (topicId: string) => {
    setSelectedTopicId(topicId);
    setShowDetailModal(true);
  }, []);

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            📊 Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'mastery' && styles.activeTab]}
          onPress={() => setActiveTab('mastery')}
        >
          <Text style={[styles.tabText, activeTab === 'mastery' && styles.activeTabText]}>
            🎯 Mastery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            💡 Practice
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={[styles.tabText, activeTab === 'content' && styles.activeTabText]}>
            📦 Content
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTopicDetailModal = () => {
    if (!selectedTopicId) return null;

    const topicProficiency = proficiencies.find(p => p.topicId === selectedTopicId);
    
    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {getTopicDisplayName(selectedTopicId)}
            </Text>
            <TouchableOpacity
              style={styles.modalPracticeButton}
              onPress={() => {
                setShowDetailModal(false);
                handleStartPractice([selectedTopicId], 'adaptive');
              }}
            >
              <Text style={styles.modalPracticeText}>Practice</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {topicProficiency && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Current Proficiency</Text>
                <View style={styles.proficiencyDetails}>
                  <View style={styles.proficiencyScore}>
                    <Text style={styles.proficiencyNumber}>
                      {(topicProficiency.proficiency * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.masteryLevel}>
                      {getMasteryLevel(topicProficiency.proficiency)}
                    </Text>
                  </View>
                  
                  <View style={styles.proficiencyMetrics}>
                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>{topicProficiency.totalAttempts}</Text>
                      <Text style={styles.metricLabel}>Questions</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>
                        {topicProficiency.totalAttempts > 0 
                          ? Math.round((topicProficiency.correctAttempts / topicProficiency.totalAttempts) * 100)
                          : 0}%
                      </Text>
                      <Text style={styles.metricLabel}>Accuracy</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>
                        {Math.round(topicProficiency.averageTimeSpent / 1000)}s
                      </Text>
                      <Text style={styles.metricLabel}>Avg Time</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Difficulty Breakdown</Text>
              {topicProficiency && (
                <View style={styles.difficultyBreakdown}>
                  {Object.entries(topicProficiency.difficultyBreakdown).map(([difficulty, stats]) => (
                    <View key={difficulty} style={styles.difficultyItem}>
                      <Text style={styles.difficultyLabel}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </Text>
                      <View style={styles.difficultyStats}>
                        <Text style={styles.difficultyScore}>
                          {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                        </Text>
                        <Text style={styles.difficultyCount}>
                          ({stats.correct}/{stats.total})
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Recent Trend</Text>
              <View style={styles.trendContainer}>
                <Text style={styles.trendText}>
                  {topicProficiency?.trend === 'improving' && '📈 Improving'}
                  {topicProficiency?.trend === 'stable' && '➡️ Stable'}
                  {topicProficiency?.trend === 'declining' && '📉 Declining'}
                  {topicProficiency?.trend === 'unknown' && '❓ Not enough data'}
                </Text>
                
                {topicProficiency?.needsReview && (
                  <View style={styles.reviewAlert}>
                    <Text style={styles.reviewAlertText}>
                      ⚠️ This topic needs review
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Next Steps</Text>
              <View style={styles.recommendationsContainer}>
                <TouchableOpacity
                  style={styles.recommendationButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    handleStartPractice([selectedTopicId], 'easy');
                  }}
                >
                  <Text style={styles.recommendationButtonText}>
                    📝 Practice Easy Questions
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.recommendationButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    handleStartPractice([selectedTopicId], 'hard');
                  }}
                >
                  <Text style={styles.recommendationButtonText}>
                    ⚡ Challenge Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProfileDashboard />;
      
      case 'mastery':
        return (
          <MasteryDashboard
            onStartPractice={handleStartPractice}
            onViewDetails={handleViewTopicDetails}
          />
        );
      
      case 'recommendations':
        return (
          <PracticeRecommendations
            onStartPractice={handleStartPractice}
            maxRecommendations={10}
          />
        );
      
      case 'content':
        return <ContentPackManagement />;
      
      case 'settings':
        return <SettingsScreen />;
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTabSelector()}
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {renderTopicDetailModal()}
    </View>
  );
};

// Helper functions
const getMasteryLevel = (proficiency: number): string => {
  if (proficiency >= 0.9) return 'Expert';
  if (proficiency >= 0.8) return 'Advanced';
  if (proficiency >= 0.7) return 'Proficient';
  if (proficiency >= 0.5) return 'Developing';
  return 'Novice';
};

const getTopicDisplayName = (topicId: string): string => {
  const topicNames: Record<string, string> = {
    'planning': 'Business Analysis Planning',
    'elicitation': 'Requirements Elicitation',
    'requirements-analysis': 'Requirements Analysis',
    'traceability': 'Requirements Traceability',
    'validation': 'Requirements Validation',
    'solution-evaluation': 'Solution Evaluation',
    'strategy-analysis': 'Strategy Analysis',
    'stakeholder-engagement': 'Stakeholder Engagement',
    'governance': 'BA Governance',
    'techniques': 'BA Techniques',
  };
  return topicNames[topicId] || topicId.replace('-', ' ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2B5CE6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },

  // Modal styles
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
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  modalPracticeButton: {
    backgroundColor: '#2B5CE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalPracticeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Detail section styles
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  proficiencyDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  proficiencyScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  proficiencyNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2B5CE6',
    marginBottom: 4,
  },
  masteryLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  proficiencyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  difficultyBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  difficultyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  difficultyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B5CE6',
    marginRight: 8,
  },
  difficultyCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  trendContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  reviewAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  reviewAlertText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationButton: {
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recommendationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2B5CE6',
    textAlign: 'center',
  },
});

export default ProfileScreen;
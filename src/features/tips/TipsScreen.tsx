import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Tip } from '../../shared/types/database';
import { useTips } from './hooks/useTips';
import TipSearch from './components/TipSearch';
import TipCard from './components/TipCard';
import TipDetail from './components/TipDetail';

type ViewMode = 'list' | 'detail' | 'bookmarks' | 'recent';

const TipsScreen: React.FC = () => {
  const {
    tips,
    bookmarkedTips,
    recentlyViewedTips,
    availableTopics,
    isLoading,
    isSearching,
    searchTips,
    loadMoreTips,
    refreshTips,
    toggleBookmark,
    markTipAsViewed,
    clearSearch,
    getRelatedTips,
    isBookmarked,
  } = useTips();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [relatedTips, setRelatedTips] = useState<Tip[]>([]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'list' && tips.length === 0) {
        refreshTips();
      }
    }, [viewMode, tips.length, refreshTips])
  );

  const handleSearch = useCallback(async (query: string, topicIds: string[]) => {
    await searchTips(query, topicIds);
  }, [searchTips]);

  const handleTipPress = useCallback(async (tip: Tip) => {
    setSelectedTip(tip);
    setViewMode('detail');
    
    // Mark as viewed and load related tips
    await markTipAsViewed(tip);
    const related = await getRelatedTips(tip);
    setRelatedTips(related);
  }, [markTipAsViewed, getRelatedTips]);

  const handleBookmark = useCallback(async (tip: Tip) => {
    await toggleBookmark(tip);
  }, [toggleBookmark]);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTip(null);
    setRelatedTips([]);
  }, []);

  const handleStartPractice = useCallback((tip: Tip) => {
    // TODO: Navigate to practice screen filtered by tip's topics
    console.log('Start practice for tip:', tip.title);
    // navigation.navigate('Practice', { topicIds: tip.topicIds });
  }, []);

  const renderTipItem = useCallback(({ item }: { item: Tip }) => (
    <TipCard
      tip={item}
      isBookmarked={isBookmarked(item.id)}
      onPress={handleTipPress}
      onBookmark={handleBookmark}
      onStartPractice={handleStartPractice}
      topicNames={{
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
      }}
    />
  ), [isBookmarked, handleTipPress, handleBookmark, handleStartPractice]);

  const renderLoadMoreFooter = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="large" color="#2B5CE6" />
        <Text style={styles.loadMoreText}>Loading more tips...</Text>
      </View>
    );
  }, [isLoading]);

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No tips found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or browse different topics
      </Text>
      <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
        <Text style={styles.clearSearchText}>Clear Search</Text>
      </TouchableOpacity>
    </View>
  ), [clearSearch]);

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'list' && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode('list')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'list' && styles.viewModeTextActive,
        ]}>
          All Tips
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'bookmarks' && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode('bookmarks')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'bookmarks' && styles.viewModeTextActive,
        ]}>
          Bookmarks ({bookmarkedTips.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'recent' && styles.viewModeButtonActive,
        ]}
        onPress={() => setViewMode('recent')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'recent' && styles.viewModeTextActive,
        ]}>
          Recent
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getCurrentTips = () => {
    switch (viewMode) {
      case 'bookmarks':
        return bookmarkedTips;
      case 'recent':
        return recentlyViewedTips;
      default:
        return tips;
    }
  };

  const renderListView = () => (
    <View style={styles.container}>
      {/* Search */}
      <TipSearch
        onSearch={handleSearch}
        availableTopics={availableTopics}
        isLoading={isSearching}
      />

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Tips List */}
      <FlatList
        data={getCurrentTips()}
        keyExtractor={(item) => item.id}
        renderItem={renderTipItem}
        onEndReached={viewMode === 'list' ? loadMoreTips : undefined}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && tips.length === 0}
            onRefresh={refreshTips}
            colors={['#2B5CE6']}
            tintColor="#2B5CE6"
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderLoadMoreFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          getCurrentTips().length === 0 && styles.emptyListContainer,
        ]}
      />
    </View>
  );

  const renderDetailView = () => {
    if (!selectedTip) return renderListView();

    return (
      <TipDetail
        tip={selectedTip}
        isBookmarked={isBookmarked(selectedTip.id)}
        onBack={handleBackToList}
        onBookmark={handleBookmark}
        onStartPractice={handleStartPractice}
        topicNames={{
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
        }}
        relatedTips={relatedTips}
        onRelatedTipPress={handleTipPress}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {viewMode === 'detail' ? renderDetailView() : renderListView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#EBF4FF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewModeTextActive: {
    color: '#2B5CE6',
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#2B5CE6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default TipsScreen;
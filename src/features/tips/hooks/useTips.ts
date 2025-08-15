import { useState, useEffect, useCallback } from 'react';
import { Tip } from '../../../shared/types/database';
import { RepositoryFactory } from '../../../data/repositories/RepositoryFactory';
import { TipSearchOptions } from '../../../data/repositories/TipRepository';

export interface UseTipsState {
  tips: Tip[];
  bookmarkedTips: Tip[];
  recentlyViewedTips: Tip[];
  availableTopics: { id: string; name: string; count: number }[];
  isLoading: boolean;
  isSearching: boolean;
  isBookmarking: boolean;
  error: string | null;
  searchQuery: string;
  selectedTopicIds: string[];
  hasMore: boolean;
  totalCount: number;
}

export interface UseTipsActions {
  searchTips: (query: string, topicIds: string[]) => Promise<void>;
  loadMoreTips: () => Promise<void>;
  refreshTips: () => Promise<void>;
  toggleBookmark: (tip: Tip) => Promise<void>;
  markTipAsViewed: (tip: Tip) => Promise<void>;
  loadBookmarkedTips: () => Promise<void>;
  loadRecentlyViewedTips: () => Promise<void>;
  clearSearch: () => void;
  getTipsByTopicIds: (topicIds: string[]) => Promise<Tip[]>;
  getRelatedTips: (tip: Tip) => Promise<Tip[]>;
  isBookmarked: (tipId: string) => boolean;
}

const TIPS_PER_PAGE = 20;
const DEVICE_GUID = 'device-123'; // In production, get from secure storage

// Topic ID to name mapping - in production, this would come from API/config
const TOPIC_NAMES: Record<string, string> = {
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

export const useTips = (): UseTipsState & UseTipsActions => {
  const [state, setState] = useState<UseTipsState>({
    tips: [],
    bookmarkedTips: [],
    recentlyViewedTips: [],
    availableTopics: [],
    isLoading: false,
    isSearching: false,
    isBookmarking: false,
    error: null,
    searchQuery: '',
    selectedTopicIds: [],
    hasMore: true,
    totalCount: 0,
  });

  const tipRepository = RepositoryFactory.getTipRepository();

  const loadAvailableTopics = useCallback(async () => {
    try {
      const topicsWithCounts = await tipRepository.getTopicsWithTipCounts();
      const availableTopics = topicsWithCounts.map(({ topicId, count }) => ({
        id: topicId,
        name: TOPIC_NAMES[topicId] || topicId,
        count,
      }));

      setState(prev => ({ ...prev, availableTopics }));
    } catch (error) {
      console.error('Error loading available topics:', error);
    }
  }, [tipRepository]);

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load initial tips
      const tips = await tipRepository.searchTips({ 
        limit: TIPS_PER_PAGE,
        offset: 0,
      });

      // Load total count
      const totalCount = await tipRepository.getTipsCount();

      // Load recently viewed and bookmarked tips
      const [recentlyViewedTips, bookmarkedTips] = await Promise.all([
        tipRepository.getRecentlyViewedTips(DEVICE_GUID, 10),
        tipRepository.getBookmarkedTips(DEVICE_GUID),
      ]);

      setState(prev => ({
        ...prev,
        tips,
        recentlyViewedTips,
        bookmarkedTips,
        totalCount,
        hasMore: tips.length < totalCount,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load tips',
        isLoading: false,
      }));
    }
  }, [tipRepository]);

  // Load available topics with counts on mount
  useEffect(() => {
    loadAvailableTopics();
    loadInitialData();
  }, [loadAvailableTopics, loadInitialData]);

  const searchTips = useCallback(async (query: string, topicIds: string[]) => {
    setState(prev => ({ 
      ...prev, 
      isSearching: true, 
      error: null,
      searchQuery: query,
      selectedTopicIds: topicIds,
    }));

    try {
      const searchOptions: TipSearchOptions = {
        query: query.trim() || undefined,
        topicIds: topicIds.length > 0 ? topicIds : undefined,
        limit: TIPS_PER_PAGE,
        offset: 0,
      };

      const tips = await tipRepository.searchTips(searchOptions);
      
      setState(prev => ({
        ...prev,
        tips,
        hasMore: tips.length === TIPS_PER_PAGE, // Assume more if we got full page
        isSearching: false,
      }));
    } catch (error) {
      console.error('Error searching tips:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to search tips',
        isSearching: false,
      }));
    }
  }, [tipRepository]);

  const loadMoreTips = useCallback(async () => {
    if (!state.hasMore || state.isLoading || state.isSearching) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const searchOptions: TipSearchOptions = {
        query: state.searchQuery.trim() || undefined,
        topicIds: state.selectedTopicIds.length > 0 ? state.selectedTopicIds : undefined,
        limit: TIPS_PER_PAGE,
        offset: state.tips.length,
      };

      const moreTips = await tipRepository.searchTips(searchOptions);
      
      setState(prev => ({
        ...prev,
        tips: [...prev.tips, ...moreTips],
        hasMore: moreTips.length === TIPS_PER_PAGE,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading more tips:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load more tips',
        isLoading: false,
      }));
    }
  }, [state.hasMore, state.isLoading, state.isSearching, state.searchQuery, state.selectedTopicIds, state.tips.length, tipRepository]);

  const refreshTips = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      searchQuery: '', 
      selectedTopicIds: [],
    }));
    await loadInitialData();
  }, [loadInitialData]);

  const toggleBookmark = useCallback(async (tip: Tip) => {
    setState(prev => ({ ...prev, isBookmarking: true }));

    try {
      const isNowBookmarked = await tipRepository.toggleBookmark(tip.id, DEVICE_GUID);
      
      setState(prev => ({
        ...prev,
        bookmarkedTips: isNowBookmarked
          ? [...prev.bookmarkedTips, tip]
          : prev.bookmarkedTips.filter(t => t.id !== tip.id),
        isBookmarking: false,
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to bookmark tip',
        isBookmarking: false,
      }));
    }
  }, [tipRepository]);

  const markTipAsViewed = useCallback(async (tip: Tip) => {
    try {
      await tipRepository.markTipAsViewed(tip.id, DEVICE_GUID);
      
      // Update recently viewed tips
      setState(prev => ({
        ...prev,
        recentlyViewedTips: [
          tip,
          ...prev.recentlyViewedTips.filter(t => t.id !== tip.id),
        ].slice(0, 10), // Keep only 10 most recent
      }));
    } catch (error) {
      console.error('Error marking tip as viewed:', error);
    }
  }, [tipRepository]);

  const loadBookmarkedTips = useCallback(async () => {
    try {
      const bookmarkedTips = await tipRepository.getBookmarkedTips(DEVICE_GUID);
      setState(prev => ({ ...prev, bookmarkedTips }));
    } catch (error) {
      console.error('Error loading bookmarked tips:', error);
    }
  }, [tipRepository]);

  const loadRecentlyViewedTips = useCallback(async () => {
    try {
      const recentlyViewedTips = await tipRepository.getRecentlyViewedTips(DEVICE_GUID, 10);
      setState(prev => ({ ...prev, recentlyViewedTips }));
    } catch (error) {
      console.error('Error loading recently viewed tips:', error);
    }
  }, [tipRepository]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      selectedTopicIds: [],
    }));
    loadInitialData();
  }, [loadInitialData]);

  const getTipsByTopicIds = useCallback(async (topicIds: string[]): Promise<Tip[]> => {
    try {
      return await tipRepository.getTipsByTopicIds(topicIds);
    } catch (error) {
      console.error('Error getting tips by topic IDs:', error);
      return [];
    }
  }, [tipRepository]);

  const getRelatedTips = useCallback(async (tip: Tip): Promise<Tip[]> => {
    try {
      // Get tips with similar topics, excluding the current tip
      const relatedTips = await tipRepository.getTipsByTopicIds(tip.topicIds);
      return relatedTips.filter(t => t.id !== tip.id).slice(0, 5);
    } catch (error) {
      console.error('Error getting related tips:', error);
      return [];
    }
  }, [tipRepository]);

  // Helper function to check if a tip is bookmarked
  const isBookmarked = useCallback((tipId: string): boolean => {
    return state.bookmarkedTips.some(tip => tip.id === tipId);
  }, [state.bookmarkedTips]);

  return {
    ...state,
    searchTips,
    loadMoreTips,
    refreshTips,
    toggleBookmark,
    markTipAsViewed,
    loadBookmarkedTips,
    loadRecentlyViewedTips,
    clearSearch,
    getTipsByTopicIds,
    getRelatedTips,
    isBookmarked,
  };
};
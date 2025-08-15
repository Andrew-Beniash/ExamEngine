import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';

export interface TipSearchProps {
  onSearch: (query: string, topicIds: string[]) => void;
  availableTopics: { id: string; name: string; count: number }[];
  isLoading?: boolean;
}

const TipSearch: React.FC<TipSearchProps> = ({
  onSearch,
  availableTopics,
  isLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(query.trim(), selectedTopics);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTopics([]);
    onSearch('', []);
  };

  const applyFilters = () => {
    handleSearch();
    setShowFilters(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tips and explanations..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#9CA3AF"
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedTopics.length > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {selectedTopics.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedTopics.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {selectedTopics.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTopics.map(topicId => {
              const topic = availableTopics.find(t => t.id === topicId);
              return (
                <TouchableOpacity
                  key={topicId}
                  style={styles.activeFilterChip}
                  onPress={() => toggleTopic(topicId)}
                >
                  <Text style={styles.activeFilterText}>
                    {topic?.name || topicId}
                  </Text>
                  <Text style={styles.removeFilterText}>✕</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.clearAllFilters}
              onPress={clearFilters}
            >
              <Text style={styles.clearAllFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Search Button */}
      <TouchableOpacity
        style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={isLoading}
      >
        <Text style={styles.searchButtonText}>
          {isLoading ? 'Searching...' : 'Search'}
        </Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter by Topics</Text>
            <TouchableOpacity onPress={applyFilters}>
              <Text style={styles.modalApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.topicsContainer}>
              {availableTopics.map(topic => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicItem,
                      isSelected && styles.topicItemSelected,
                    ]}
                    onPress={() => toggleTopic(topic.id)}
                  >
                    <View style={styles.topicItemContent}>
                      <View style={styles.topicInfo}>
                        <Text style={[
                          styles.topicName,
                          isSelected && styles.topicNameSelected,
                        ]}>
                          {topic.name}
                        </Text>
                        <Text style={styles.topicCount}>
                          {topic.count} tip{topic.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}>
                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setSelectedTopics([])}
            >
              <Text style={styles.clearFiltersButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#374151',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2B5CE6',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#2B5CE6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    marginBottom: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2B5CE6',
  },
  activeFilterText: {
    color: '#2B5CE6',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeFilterText: {
    color: '#2B5CE6',
    fontSize: 12,
  },
  clearAllFilters: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clearAllFiltersText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalApplyText: {
    fontSize: 16,
    color: '#2B5CE6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  topicsContainer: {
    padding: 16,
  },
  topicItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicItemSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2B5CE6',
  },
  topicItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  topicNameSelected: {
    color: '#2B5CE6',
  },
  topicCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2B5CE6',
    borderColor: '#2B5CE6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearFiltersButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TipSearch;
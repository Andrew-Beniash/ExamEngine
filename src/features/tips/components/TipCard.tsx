import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Tip } from '../../../shared/types/database';

export interface TipCardProps {
  tip: Tip;
  isBookmarked: boolean;
  onPress: (tip: Tip) => void;
  onBookmark: (tip: Tip) => void;
  onStartPractice?: (tip: Tip) => void;
  showTopics?: boolean;
  topicNames?: Record<string, string>;
}

const TipCard: React.FC<TipCardProps> = ({
  tip,
  isBookmarked,
  onPress,
  onBookmark,
  onStartPractice,
  showTopics = true,
  topicNames = {},
}) => {
  // Extract preview text from HTML body (first 150 characters)
  const getPreviewText = (htmlBody: string): string => {
    // Simple HTML strip - in production, you might want a more robust solution
    const textOnly = htmlBody
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textOnly.length > 150 
      ? textOnly.substring(0, 150) + '...'
      : textOnly;
  };

  const renderTopics = () => {
    if (!showTopics || tip.topicIds.length === 0) return null;

    return (
      <View style={styles.topicsContainer}>
        {tip.topicIds.slice(0, 3).map((topicId, _index) => (
          <View key={topicId} style={styles.topicChip}>
            <Text style={styles.topicText}>
              {topicNames[topicId] || topicId}
            </Text>
          </View>
        ))}
        {tip.topicIds.length > 3 && (
          <View style={styles.topicChip}>
            <Text style={styles.topicText}>
              +{tip.topicIds.length - 3} more
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(tip)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {tip.title}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => onBookmark(tip)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[
              styles.bookmarkIcon,
              isBookmarked && styles.bookmarkIconActive,
            ]}>
              {isBookmarked ? '🔖' : '📖'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Topics */}
        {renderTopics()}

        {/* Preview */}
        <Text style={styles.preview} numberOfLines={3}>
          {getPreviewText(tip.body)}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => onPress(tip)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
            <Text style={styles.readMoreIcon}>→</Text>
          </TouchableOpacity>

          {onStartPractice && (
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={() => onStartPractice(tip)}
            >
              <Text style={styles.practiceButtonText}>Practice</Text>
              <Text style={styles.practiceIcon}>🎯</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Type Indicator */}
      <View style={styles.typeIndicator}>
        <Text style={styles.typeIcon}>💡</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 24,
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  bookmarkIconActive: {
    fontSize: 20,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  topicChip: {
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  topicText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  preview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readMoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  readMoreIcon: {
    fontSize: 14,
    color: '#6B7280',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2B5CE6',
  },
  practiceButtonText: {
    fontSize: 14,
    color: '#2B5CE6',
    fontWeight: '600',
    marginRight: 4,
  },
  practiceIcon: {
    fontSize: 14,
  },
  typeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  typeIcon: {
    fontSize: 16,
  },
});

export default TipCard;
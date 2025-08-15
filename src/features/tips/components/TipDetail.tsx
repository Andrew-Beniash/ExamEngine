import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Tip } from '../../../shared/types/database';

const { width: screenWidth } = Dimensions.get('window');

export interface TipDetailProps {
  tip: Tip;
  isBookmarked: boolean;
  onBack: () => void;
  onBookmark: (tip: Tip) => void;
  onStartPractice?: (tip: Tip) => void;
  onShareTip?: (tip: Tip) => void;
  topicNames?: Record<string, string>;
  relatedTips?: Tip[];
  onRelatedTipPress?: (tip: Tip) => void;
}

const TipDetail: React.FC<TipDetailProps> = ({
  tip,
  isBookmarked,
  onBack,
  onBookmark,
  onStartPractice,
  onShareTip,
  topicNames = {},
  relatedTips = [],
  onRelatedTipPress,
}) => {
  const handleShare = async () => {
    if (onShareTip) {
      onShareTip(tip);
      return;
    }

    // Default share behavior
    try {
      await Share.share({
        message: `${tip.title}\n\n${tip.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`,
        title: tip.title,
      });
    } catch (error) {
      console.error('Error sharing tip:', error);
    }
  };

  const renderTopics = () => {
    if (tip.topicIds.length === 0) return null;

    return (
      <View style={styles.topicsSection}>
        <Text style={styles.sectionTitle}>Topics</Text>
        <View style={styles.topicsContainer}>
          {tip.topicIds.map(topicId => (
            <View key={topicId} style={styles.topicChip}>
              <Text style={styles.topicText}>
                {topicNames[topicId] || topicId}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRelatedTips = () => {
    if (relatedTips.length === 0) return null;

    return (
      <View style={styles.relatedSection}>
        <Text style={styles.sectionTitle}>Related Tips</Text>
        {relatedTips.slice(0, 3).map(relatedTip => (
          <TouchableOpacity
            key={relatedTip.id}
            style={styles.relatedTipItem}
            onPress={() => onRelatedTipPress?.(relatedTip)}
          >
            <View style={styles.relatedTipContent}>
              <Text style={styles.relatedTipTitle} numberOfLines={2}>
                {relatedTip.title}
              </Text>
              <Text style={styles.relatedTipArrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        {onStartPractice && (
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={() => onStartPractice(tip)}
          >
            <Text style={styles.practiceButtonIcon}>🎯</Text>
            <Text style={styles.practiceButtonText}>Start Practice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonIcon}>📤</Text>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Tips</Text>
        </TouchableOpacity>

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

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{tip.title}</Text>
        </View>

        {/* Topics */}
        {renderTopics()}

        {/* Body Content */}
        <View style={styles.bodyContainer}>
          <RenderHtml
            contentWidth={screenWidth - 32}
            source={{ html: tip.body }}
            tagsStyles={{
              p: {
                margin: 0,
                marginBottom: 16,
                fontSize: 16,
                lineHeight: 24,
                color: '#374151',
              },
              h1: {
                fontSize: 24,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 16,
                marginTop: 24,
              },
              h2: {
                fontSize: 20,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 12,
                marginTop: 20,
              },
              h3: {
                fontSize: 18,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
                marginTop: 16,
              },
              strong: {
                fontWeight: '600',
                color: '#1F2937',
              },
              em: {
                fontStyle: 'italic',
                color: '#6B7280',
              },
              ul: {
                marginBottom: 16,
              },
              ol: {
                marginBottom: 16,
              },
              li: {
                fontSize: 16,
                lineHeight: 24,
                color: '#374151',
                marginBottom: 8,
              },
              blockquote: {
                backgroundColor: '#F9FAFB',
                borderLeftWidth: 4,
                borderLeftColor: '#2B5CE6',
                padding: 16,
                marginVertical: 16,
                borderRadius: 8,
              },
              code: {
                backgroundColor: '#F3F4F6',
                fontFamily: 'Menlo, Monaco, monospace',
                fontSize: 14,
                padding: 2,
                borderRadius: 4,
              },
              pre: {
                backgroundColor: '#1F2937',
                color: '#F9FAFB',
                padding: 16,
                borderRadius: 8,
                marginVertical: 16,
              },
            }}
            systemFonts={['SF Pro Display', 'Helvetica Neue', 'Helvetica', 'Arial']}
          />
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Related Tips */}
        {renderRelatedTips()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#2B5CE6',
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: '#2B5CE6',
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  bookmarkIconActive: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  titleContainer: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 36,
  },
  topicsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  topicText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  bodyContainer: {
    marginBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  practiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B5CE6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  practiceButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  practiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  relatedSection: {
    marginBottom: 24,
  },
  relatedTipItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  relatedTipContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relatedTipTitle: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginRight: 12,
  },
  relatedTipArrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default TipDetail;
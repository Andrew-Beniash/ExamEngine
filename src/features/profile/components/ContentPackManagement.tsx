import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface ContentPack {
  id: string;
  name: string;
  description: string;
  version: string;
  size: number; // bytes
  downloadUrl?: string;
  isInstalled: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  lastUpdated: string;
  category: 'certification' | 'practice' | 'reference';
  topics: string[];
  questionCount: number;
  tipCount: number;
}

interface StorageInfo {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  cacheSize: number;
  contentSize: number;
}

const ContentPackManagement: React.FC = () => {
  const [contentPacks, setContentPacks] = useState<ContentPack[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'installed' | 'available'>('installed');

  const loadContentPacks = useCallback(async (): Promise<void> => {
    try {
      // Mock data - in real implementation, this would come from your PackManager
      const mockPacks: ContentPack[] = [
        {
          id: 'cbap-fundamentals',
          name: 'CBAP Fundamentals',
          description: 'Essential BABOK knowledge areas and core concepts',
          version: '2.1.0',
          size: 45000000, // 45MB
          isInstalled: true,
          lastUpdated: '2024-01-15T10:00:00Z',
          category: 'certification',
          topics: ['planning', 'elicitation', 'analysis'],
          questionCount: 500,
          tipCount: 120,
        },
        {
          id: 'cbap-advanced',
          name: 'CBAP Advanced Topics',
          description: 'Advanced business analysis techniques and methodologies',
          version: '1.8.0',
          size: 62000000, // 62MB
          isInstalled: false,
          downloadUrl: 'https://cdn.example.com/cbap-advanced-1.8.0.pack',
          lastUpdated: '2024-01-20T14:30:00Z',
          category: 'certification',
          topics: ['strategy', 'solution-evaluation', 'governance'],
          questionCount: 750,
          tipCount: 200,
        },
        {
          id: 'practice-drills',
          name: 'Practice Drills Collection',
          description: 'Focused practice sessions for weak areas',
          version: '3.0.1',
          size: 28000000, // 28MB
          isInstalled: true,
          lastUpdated: '2024-01-18T09:15:00Z',
          category: 'practice',
          topics: ['validation', 'traceability'],
          questionCount: 300,
          tipCount: 80,
        },
        {
          id: 'babok-reference',
          name: 'BABOK Quick Reference',
          description: 'Searchable BABOK guide with templates and examples',
          version: '4.2.0',
          size: 15000000, // 15MB
          isInstalled: false,
          downloadUrl: 'https://cdn.example.com/babok-reference-4.2.0.pack',
          lastUpdated: '2024-01-22T16:45:00Z',
          category: 'reference',
          topics: ['techniques', 'stakeholder'],
          questionCount: 0,
          tipCount: 300,
        },
      ];

      setContentPacks(mockPacks);
    } catch (error) {
      console.error('Error loading content packs:', error);
      Alert.alert('Error', 'Failed to load content packs');
    }
  }, []);

  const loadStorageInfo = useCallback(async (): Promise<void> => {
    try {
      // Mock storage info - in real implementation, use react-native-fs
      const mockStorageInfo: StorageInfo = {
        totalSpace: 64000000000, // 64GB
        usedSpace: 12000000000, // 12GB
        availableSpace: 52000000000, // 52GB
        cacheSize: 150000000, // 150MB
        contentSize: 135000000, // 135MB
      };

      setStorageInfo(mockStorageInfo);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  }, []);

  useEffect(() => {
    loadContentPacks();
    loadStorageInfo();
  }, [loadContentPacks, loadStorageInfo]);

  // Fix: Add proper event handlers for tab switching with explicit typing
  const handleInstalledTabPress = useCallback((): void => {
    setActiveTab('installed');
  }, []);

  const handleAvailableTabPress = useCallback((): void => {
    setActiveTab('available');
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (category: ContentPack['category']): string => {
    switch (category) {
      case 'certification': return '🎓';
      case 'practice': return '🎯';
      case 'reference': return '📚';
      default: return '📦';
    }
  };

  const getCategoryColor = (category: ContentPack['category']): string => {
    switch (category) {
      case 'certification': return '#2B5CE6';
      case 'practice': return '#059669';
      case 'reference': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const handleDownloadPack = useCallback(async (pack: ContentPack): Promise<void> => {
    try {
      Alert.alert(
        'Download Content Pack',
        `Download "${pack.name}" (${formatBytes(pack.size)})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async (): Promise<void> => {
              // Start download
              setContentPacks(prev => prev.map(p => 
                p.id === pack.id 
                  ? { ...p, isDownloading: true, downloadProgress: 0 }
                  : p
              ));

              // Simulate download progress
              for (let progress = 0; progress <= 100; progress += 10) {
                await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
                setContentPacks(prev => prev.map(p => 
                  p.id === pack.id 
                    ? { ...p, downloadProgress: progress }
                    : p
                ));
              }

              // Complete download
              setContentPacks(prev => prev.map(p => 
                p.id === pack.id 
                  ? { ...p, isInstalled: true, isDownloading: false, downloadProgress: undefined }
                  : p
              ));

              Alert.alert('Success', `${pack.name} has been downloaded and installed.`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error downloading pack:', error);
      Alert.alert('Error', 'Failed to download content pack');
    }
  }, []);

  const handleDeletePack = useCallback((pack: ContentPack): void => {
    Alert.alert(
      'Remove Content Pack',
      `Remove "${pack.name}"? You can download it again later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: (): void => {
            setContentPacks(prev => prev.map(p => 
              p.id === pack.id ? { ...p, isInstalled: false } : p
            ));
          },
        },
      ]
    );
  }, []);

  const handleClearCache = useCallback((): void => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may slow down the app initially.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: (): void => {
            if (storageInfo) {
              setStorageInfo({
                ...storageInfo,
                cacheSize: 0,
                usedSpace: storageInfo.usedSpace - storageInfo.cacheSize,
                availableSpace: storageInfo.availableSpace + storageInfo.cacheSize,
              });
            }
            Alert.alert('Success', 'Cache cleared successfully.');
          },
        },
      ]
    );
  }, [storageInfo]);

  const renderStorageInfo = (): React.ReactElement | null => {
    if (!storageInfo) return null;

    const contentPercentage = (storageInfo.contentSize / storageInfo.totalSpace) * 100;
    const cachePercentage = (storageInfo.cacheSize / storageInfo.totalSpace) * 100;

    return (
      <View style={styles.storageCard}>
        <Text style={styles.storageTitle}>📱 Storage Usage</Text>
        
        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageSegment,
              { 
                width: `${contentPercentage}%`,
              },
              styles.contentSegment,
            ]}
          />
          <View
            style={[
              styles.storageSegment,
              { 
                width: `${cachePercentage}%`,
              },
              styles.cacheSegment,
            ]}
          />
        </View>

        <View style={styles.storageStats}>
          <View style={styles.storageStat}>
            <View style={[styles.storageIndicator, styles.contentIndicator]} />
            <Text style={styles.storageStatText}>
              Content: {formatBytes(storageInfo.contentSize)}
            </Text>
          </View>
          <View style={styles.storageStat}>
            <View style={[styles.storageIndicator, styles.cacheIndicator]} />
            <Text style={styles.storageStatText}>
              Cache: {formatBytes(storageInfo.cacheSize)}
            </Text>
          </View>
        </View>

        <View style={styles.storageActions}>
          <Text style={styles.storageUsage}>
            {formatBytes(storageInfo.usedSpace)} of {formatBytes(storageInfo.totalSpace)} used
          </Text>
          <TouchableOpacity
            style={styles.clearCacheButton}
            onPress={handleClearCache}
          >
            <Text style={styles.clearCacheButtonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContentPack = (pack: ContentPack): React.ReactElement => {
    const categoryColor = getCategoryColor(pack.category);
    const categoryIcon = getCategoryIcon(pack.category);

    return (
      <View key={pack.id} style={styles.packCard}>
        <View style={styles.packHeader}>
          <View style={styles.packInfo}>
            <View style={styles.packTitleRow}>
              <Text style={styles.packIcon}>{categoryIcon}</Text>
              <Text style={styles.packName}>{pack.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryBadgeText}>{pack.category}</Text>
              </View>
            </View>
            <Text style={styles.packDescription}>{pack.description}</Text>
          </View>
        </View>

        <View style={styles.packStats}>
          <View style={styles.packStat}>
            <Text style={styles.packStatValue}>{pack.questionCount}</Text>
            <Text style={styles.packStatLabel}>Questions</Text>
          </View>
          <View style={styles.packStat}>
            <Text style={styles.packStatValue}>{pack.tipCount}</Text>
            <Text style={styles.packStatLabel}>Tips</Text>
          </View>
          <View style={styles.packStat}>
            <Text style={styles.packStatValue}>{formatBytes(pack.size)}</Text>
            <Text style={styles.packStatLabel}>Size</Text>
          </View>
        </View>

        <View style={styles.packMeta}>
          <Text style={styles.packVersion}>v{pack.version}</Text>
          <Text style={styles.packDate}>Updated {formatDate(pack.lastUpdated)}</Text>
        </View>

        {pack.isDownloading && (
          <View style={styles.downloadProgress}>
            <Text style={styles.downloadProgressText}>
              Downloading... {pack.downloadProgress}%
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${pack.downloadProgress || 0}%` },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.packActions}>
          {pack.isInstalled ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(): void => handleDeletePack(pack)}
            >
              <Text style={styles.deleteButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.downloadButton, pack.isDownloading && styles.downloadButtonDisabled]}
              onPress={(): void => { handleDownloadPack(pack); }}
              disabled={pack.isDownloading}
            >
              <Text style={styles.downloadButtonText}>
                {pack.isDownloading ? 'Downloading...' : 'Download'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const installedPacks = contentPacks.filter(pack => pack.isInstalled);
  const availablePacks = contentPacks.filter(pack => !pack.isInstalled);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage your downloaded content and storage
        </Text>
      </View>

      {/* Storage Info */}
      {renderStorageInfo()}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'installed' && styles.activeTab]}
          onPress={handleInstalledTabPress}
        >
          <Text
            style={[styles.tabText, activeTab === 'installed' && styles.activeTabText]}
          >
            Installed ({installedPacks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={handleAvailableTabPress}
        >
          <Text
            style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}
          >
            Available ({availablePacks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'installed' ? (
          installedPacks.length > 0 ? (
            installedPacks.map(renderContentPack)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>No Content Installed</Text>
              <Text style={styles.emptyStateSubtitle}>
                Download content packs to get started
              </Text>
            </View>
          )
        ) : (
          availablePacks.map(renderContentPack)
        )}
      </View>

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
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  storageCard: {
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
  storageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  storageBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    flexDirection: 'row',
    marginBottom: 12,
  },
  storageSegment: {
    height: '100%',
    borderRadius: 4,
  },
  contentSegment: {
    backgroundColor: '#2B5CE6',
  },
  cacheSegment: {
    backgroundColor: '#EAB308',
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  storageStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  contentIndicator: {
    backgroundColor: '#2B5CE6',
  },
  cacheIndicator: {
    backgroundColor: '#EAB308',
  },
  storageStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  storageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageUsage: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clearCacheButton: {
    backgroundColor: '#EAB308',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearCacheButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
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
  content: {
    paddingHorizontal: 16,
  },
  packCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packHeader: {
    marginBottom: 16,
  },
  packInfo: {
    flex: 1,
  },
  packTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  packName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  packDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  packStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  packStat: {
    alignItems: 'center',
  },
  packStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  packStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  packMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  packVersion: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  packDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  downloadProgress: {
    marginBottom: 16,
  },
  downloadProgressText: {
    fontSize: 14,
    color: '#2B5CE6',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2B5CE6',
    borderRadius: 3,
  },
  packActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadButton: {
    backgroundColor: '#2B5CE6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ContentPackManagement;
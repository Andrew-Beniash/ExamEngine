import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { PackManager, DownloadProgress } from './PackManager';

interface PackItem {
  id: string;
  name: string;
  version: string;
  description: string;
  isInstalled: boolean;
  installedVersion?: string;
  size: number;
  downloadProgress?: DownloadProgress;
}

const PacksScreen = () => {
  const [packs, setPacks] = useState<PackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPacks, setDownloadingPacks] = useState<Set<string>>(new Set());
  const packManager = PackManager.getInstance();

  const loadPacks = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration - in production, this would come from RTK Query
      const mockPacks: PackItem[] = [
        {
          id: 'cbap-sample',
          name: 'CBAP Sample Pack',
          version: '1.0.0',
          description: 'Sample questions for CBAP certification preparation',
          isInstalled: await packManager.isPackInstalled('cbap-sample'),
          installedVersion: (await packManager.getInstalledVersion('cbap-sample')) || undefined,
          size: 5242880, // 5MB
        },
        {
          id: 'cbap-advanced',
          name: 'CBAP Advanced Pack',
          version: '1.2.0',
          description: 'Advanced practice questions with detailed explanations',
          isInstalled: await packManager.isPackInstalled('cbap-advanced'),
          installedVersion: (await packManager.getInstalledVersion('cbap-advanced')) || undefined,
          size: 12582912, // 12MB
        }
      ];

      setPacks(mockPacks);
    } catch (error) {
      console.error('Failed to load packs:', error);
      Alert.alert('Error', 'Failed to load content packs');
    } finally {
      setIsLoading(false);
    }
  }, [packManager]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const handleDownload = async (pack: PackItem) => {
    if (downloadingPacks.has(pack.id)) return;

    setDownloadingPacks(prev => new Set(prev).add(pack.id));

    try {
      // Mock manifest for demonstration
      const mockManifest = {
        id: pack.id,
        version: pack.version,
        name: pack.name,
        description: pack.description,
        author: 'Exam Engine Team',
        minAppVersion: '1.0.0',
        checksum: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: 'mock_signature',
        createdAt: Date.now(),
        files: {
          questions: 'questions.jsonl',
          examTemplates: 'examTemplates.json',
          tips: 'tips.json'
        }
      };

      // Check compatibility
      const compatibility = packManager.checkCompatibility(mockManifest, '1.0.0');
      if (!compatibility.compatible) {
        Alert.alert('Incompatible', compatibility.reason || 'This pack is not compatible with your app version');
        return;
      }

      const onProgress = (progress: DownloadProgress) => {
        setPacks(prevPacks => 
          prevPacks.map(p => 
            p.id === pack.id 
              ? { ...p, downloadProgress: progress }
              : p
          )
        );
      };

      // Mock download URL
      const downloadUrl = `https://cdn.example.com/packs/${pack.id}-${pack.version}.zip`;
      
      // Download pack
      const tempPath = await packManager.downloadPack(pack.id, downloadUrl, onProgress);
      
      // Install pack
      const result = await packManager.installPack(pack.id, tempPath, mockManifest, onProgress);

      if (result.success) {
        Alert.alert('Success', `${pack.name} has been installed successfully`);
        await loadPacks(); // Refresh the list
      } else {
        Alert.alert('Installation Failed', result.errors.join('\n'));
      }

    } catch (error) {
      console.error('Download/Install failed:', error);
      Alert.alert('Error', `Failed to install ${pack.name}: ${error}`);
    } finally {
      setDownloadingPacks(prev => {
        const newSet = new Set(prev);
        newSet.delete(pack.id);
        return newSet;
      });
      
      // Clear progress
      setPacks(prevPacks => 
        prevPacks.map(p => 
          p.id === pack.id 
            ? { ...p, downloadProgress: undefined }
            : p
        )
      );
    }
  };

  const handleUninstall = async (pack: PackItem) => {
    Alert.alert(
      'Uninstall Pack',
      `Are you sure you want to uninstall ${pack.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            const success = await packManager.uninstallPack(pack.id);
            if (success) {
              Alert.alert('Success', `${pack.name} has been uninstalled`);
              await loadPacks();
            } else {
              Alert.alert('Error', 'Failed to uninstall pack');
            }
          }
        }
      ]
    );
  };

  const formatSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderPack = ({ item }: { item: PackItem }) => {
    const isDownloading = downloadingPacks.has(item.id);
    const progress = item.downloadProgress;

    return (
      <View style={styles.packItem}>
        <View style={styles.packInfo}>
          <Text style={styles.packName}>{item.name}</Text>
          <Text style={styles.packDescription}>{item.description}</Text>
          <View style={styles.packMeta}>
            <Text style={styles.packVersion}>v{item.version}</Text>
            <Text style={styles.packSize}>{formatSize(item.size)}</Text>
          </View>
          
          {item.isInstalled && (
            <Text style={styles.installedText}>
              Installed: v{item.installedVersion}
            </Text>
          )}

          {progress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {progress.status}: {progress.percentage}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress.percentage}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.packActions}>
          {!item.isInstalled ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.downloadButton,
                isDownloading && styles.disabledButton
              ]}
              onPress={() => handleDownload(item)}
              disabled={isDownloading}
            >
              <Text style={styles.buttonText}>
                {isDownloading ? 'Installing...' : 'Install'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.uninstallButton]}
              onPress={() => handleUninstall(item)}
            >
              <Text style={styles.buttonText}>Uninstall</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading content packs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Content Packs</Text>
      <Text style={styles.subtitle}>Download additional question packs and study materials</Text>
      
      <FlatList
        data={packs}
        renderItem={renderPack}
        keyExtractor={(item) => item.id}
        style={styles.packsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  packsList: {
    flex: 1,
  },
  packItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packInfo: {
    flex: 1,
    marginRight: 16,
  },
  packName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  packDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  packMeta: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  packVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 16,
  },
  packSize: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  installedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2B5CE6',
  },
  packActions: {
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  downloadButton: {
    backgroundColor: '#2B5CE6',
  },
  uninstallButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default PacksScreen;
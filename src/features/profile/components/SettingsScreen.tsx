import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { UserPreferencesRepository, UserPreferences } from '../../../data/repositories/UserPreferencesRepository';

type SettingsSection = 'privacy' | 'accessibility' | 'preferences' | 'content' | 'about' | 'data';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'select' | 'action' | 'navigation';
  value?: any;
  options?: { label: string; value: any }[];
  onPress?: () => void;
  onValueChange?: (value: any) => void;
  destructive?: boolean;
}

const SettingsScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    UserPreferencesRepository.getPreferences()
  );
  const [activeSection, setActiveSection] = useState<SettingsSection>('preferences');

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    UserPreferencesRepository.updatePreference(key, value);
  }, [preferences]);

  const handleExportData = useCallback(async () => {
    try {
      const userData = UserPreferencesRepository.exportUserData();
      const dataString = JSON.stringify(userData, null, 2);
      
      await Share.share({
        message: dataString,
        title: 'My Exam Engine Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  }, []);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your progress, settings, and bookmarks. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: () => {
            UserPreferencesRepository.clearAllData();
            setPreferences(UserPreferencesRepository.getPreferences());
            Alert.alert('Data Cleared', 'All your data has been deleted.');
          },
        },
      ]
    );
  }, []);

  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'This will reset all your preferences to default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            UserPreferencesRepository.resetPreferences();
            setPreferences(UserPreferencesRepository.getPreferences());
          },
        },
      ]
    );
  }, []);

  const openURL = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  }, []);

  const settingsSections: Record<SettingsSection, SettingsItem[]> = {
    privacy: [
      {
        id: 'analytics-opt-out',
        title: 'Disable Analytics',
        subtitle: 'Opt out of anonymous usage analytics',
        type: 'toggle',
        value: preferences.analyticsOptOut,
        onPress: () => updatePreference('analyticsOptOut', !preferences.analyticsOptOut),
      },
      {
        id: 'ad-personalization-opt-out',
        title: 'Disable Ad Personalization',
        subtitle: 'Show generic ads instead of personalized ones',
        type: 'toggle',
        value: preferences.adPersonalizationOptOut,
        onPress: () => updatePreference('adPersonalizationOptOut', !preferences.adPersonalizationOptOut),
      },
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        subtitle: 'View our privacy policy',
        type: 'action',
        onPress: () => openURL('https://yourapp.com/privacy'),
      },
    ],
    accessibility: [
      {
        id: 'font-size',
        title: 'Font Size',
        subtitle: 'Adjust text size throughout the app',
        type: 'select',
        value: preferences.fontSize,
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Extra Large', value: 'extra-large' },
        ],
      },
      {
        id: 'high-contrast',
        title: 'High Contrast Mode',
        subtitle: 'Increase contrast for better visibility',
        type: 'toggle',
        value: preferences.highContrastMode,
        onPress: () => updatePreference('highContrastMode', !preferences.highContrastMode),
      },
      {
        id: 'reduce-motion',
        title: 'Reduce Motion',
        subtitle: 'Minimize animations and transitions',
        type: 'toggle',
        value: preferences.reduceMotion,
        onPress: () => updatePreference('reduceMotion', !preferences.reduceMotion),
      },
    ],
    preferences: [
      {
        id: 'dark-mode',
        title: 'Appearance',
        subtitle: 'Choose your preferred theme',
        type: 'select',
        value: preferences.darkMode,
        options: [
          { label: 'Automatic', value: 'auto' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
      },
      {
        id: 'haptic-feedback',
        title: 'Haptic Feedback',
        subtitle: 'Feel vibrations for interactions',
        type: 'toggle',
        value: preferences.hapticFeedback,
        onPress: () => updatePreference('hapticFeedback', !preferences.hapticFeedback),
      },
      {
        id: 'sound-effects',
        title: 'Sound Effects',
        subtitle: 'Play sounds for interactions',
        type: 'toggle',
        value: preferences.soundEffects,
        onPress: () => updatePreference('soundEffects', !preferences.soundEffects),
      },
      {
        id: 'push-notifications',
        title: 'Push Notifications',
        subtitle: 'Receive study reminders and updates',
        type: 'toggle',
        value: preferences.pushNotifications,
        onPress: () => updatePreference('pushNotifications', !preferences.pushNotifications),
      },
      {
        id: 'practice-reminders',
        title: 'Practice Reminders',
        subtitle: 'Daily reminders to keep practicing',
        type: 'toggle',
        value: preferences.practiceReminders,
        onPress: () => updatePreference('practiceReminders', !preferences.practiceReminders),
      },
      {
        id: 'compact-mode',
        title: 'Compact Mode',
        subtitle: 'Show more content on screen',
        type: 'toggle',
        value: preferences.compactMode,
        onPress: () => updatePreference('compactMode', !preferences.compactMode),
      },
    ],
    content: [
      {
        id: 'cache-limit',
        title: 'Cache Limit',
        subtitle: `Currently: ${preferences.cacheLimit}MB`,
        type: 'select',
        value: preferences.cacheLimit,
        options: [
          { label: '100 MB', value: 100 },
          { label: '250 MB', value: 250 },
          { label: '500 MB', value: 500 },
          { label: '1 GB', value: 1000 },
          { label: '2 GB', value: 2000 },
        ],
      },
      {
        id: 'auto-download-updates',
        title: 'Auto-Download Updates',
        subtitle: 'Download content updates automatically',
        type: 'toggle',
        value: preferences.autoDownloadUpdates,
        onPress: () => updatePreference('autoDownloadUpdates', !preferences.autoDownloadUpdates),
      },
      {
        id: 'offline-mode',
        title: 'Offline Mode',
        subtitle: 'Disable network features to save data',
        type: 'toggle',
        value: preferences.offlineMode,
        onPress: () => updatePreference('offlineMode', !preferences.offlineMode),
      },
      {
        id: 'manage-downloads',
        title: 'Manage Downloads',
        subtitle: 'View and manage downloaded content',
        type: 'navigation',
        onPress: () => {
          // TODO: Navigate to content management screen
          Alert.alert('Coming Soon', 'Content management is coming in a future update.');
        },
      },
    ],
    data: [
      {
        id: 'export-data',
        title: 'Export Data',
        subtitle: 'Download your data for backup',
        type: 'action',
        onPress: handleExportData,
      },
      {
        id: 'reset-settings',
        title: 'Reset Settings',
        subtitle: 'Reset all preferences to defaults',
        type: 'action',
        onPress: handleResetSettings,
        destructive: true,
      },
      {
        id: 'clear-data',
        title: 'Clear All Data',
        subtitle: 'Permanently delete all app data',
        type: 'action',
        onPress: handleClearAllData,
        destructive: true,
      },
    ],
    about: [
      {
        id: 'version',
        title: 'Version',
        subtitle: '1.0.0 (Beta)',
        type: 'action',
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        type: 'action',
        onPress: () => openURL('https://yourapp.com/terms'),
      },
      {
        id: 'support',
        title: 'Contact Support',
        subtitle: 'Get help with the app',
        type: 'action',
        onPress: () => openURL('mailto:support@yourapp.com'),
      },
      {
        id: 'rate-app',
        title: 'Rate the App',
        subtitle: 'Leave a review on the App Store',
        type: 'action',
        onPress: () => {
          // TODO: Replace with actual App Store URL
          Alert.alert('Rate App', 'Thank you for your feedback!');
        },
      },
    ],
  };

  const renderSettingItem = (item: SettingsItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onPress}
              trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
              thumbColor={item.value ? '#2B5CE6' : '#F3F4F6'}
            />
          </TouchableOpacity>
        );

      case 'select':
        return (
          <View key={item.id} style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
              <View style={styles.optionsContainer}>
                {item.options?.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      item.value === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => item.onValueChange?.(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        item.value === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 'action':
      case 'navigation':
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={item.onPress}
            disabled={!item.onPress}
          >
            <View style={styles.settingContent}>
              <Text
                style={[
                  styles.settingTitle,
                  item.destructive && styles.destructiveText,
                  !item.onPress && styles.disabledText,
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            {item.type === 'navigation' && (
              <Text style={styles.chevron}>›</Text>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const sections = [
    { id: 'preferences', title: 'App Preferences', icon: '⚙️' },
    { id: 'accessibility', title: 'Accessibility', icon: '♿' },
    { id: 'privacy', title: 'Privacy', icon: '🔒' },
    { id: 'content', title: 'Content & Storage', icon: '📦' },
    { id: 'data', title: 'Data Management', icon: '💾' },
    { id: 'about', title: 'About', icon: 'ℹ️' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sectionTabs}
          contentContainerStyle={styles.sectionTabsContent}
        >
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionTab,
                activeSection === section.id && styles.sectionTabActive,
              ]}
              onPress={() => setActiveSection(section.id as SettingsSection)}
            >
              <Text style={styles.sectionTabIcon}>{section.icon}</Text>
              <Text
                style={[
                  styles.sectionTabText,
                  activeSection === section.id && styles.sectionTabTextActive,
                ]}
              >
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Settings Content */}
        <ScrollView
          style={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>
              {sections.find(s => s.id === activeSection)?.title}
            </Text>
            
            {settingsSections[activeSection].map(renderSettingItem)}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  sectionTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 100,
  },
  sectionTabActive: {
    backgroundColor: '#EBF4FF',
  },
  sectionTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTabTextActive: {
    color: '#2B5CE6',
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  destructiveText: {
    color: '#EF4444',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2B5CE6',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#2B5CE6',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;
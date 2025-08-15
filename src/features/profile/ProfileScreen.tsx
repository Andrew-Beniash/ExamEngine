import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import ProfileDashboard from './components/ProfileDashboard';
import SettingsScreen from './components/SettingsScreen';
import ContentPackManagement from './components/ContentPackManagement';

type ProfileTab = 'dashboard' | 'settings' | 'content';

const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('dashboard');

  const renderTabIcon = (tab: ProfileTab): string => {
    switch (tab) {
      case 'dashboard': return '📊';
      case 'settings': return '⚙️';
      case 'content': return '📦';
      default: return '📊';
    }
  };

  const renderTabTitle = (tab: ProfileTab): string => {
    switch (tab) {
      case 'dashboard': return 'Progress';
      case 'settings': return 'Settings';
      case 'content': return 'Content';
      default: return 'Progress';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProfileDashboard />;
      case 'settings':
        return <SettingsScreen />;
      case 'content':
        return <ContentPackManagement />;
      default:
        return <ProfileDashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {(['dashboard', 'settings', 'content'] as ProfileTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabIcon}>{renderTabIcon(tab)}</Text>
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {renderTabTitle(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2B5CE6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default ProfileScreen;
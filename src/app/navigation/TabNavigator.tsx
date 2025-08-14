import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

// Import screens
import HomeScreen from '../../features/home/HomeScreen';
import PracticeScreen from '../../features/practice/PracticeScreen';
import ExamEngineScreen from '../../features/exam-engine/ExamScreen'; // Our new exam screen
import TipsScreen from '../../features/tips/TipsScreen';
import ProfileScreen from '../../features/profile/ProfileScreen';
import PacksScreen from '../../features/content-packs/PacksScreen';

const Tab = createBottomTabNavigator();

// Define icon components outside render to avoid React warnings
const HomeIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>🏠</Text>
);

const PracticeIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>📝</Text>
);

const ExamIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>⏱️</Text>
);

const TipsIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>💡</Text>
);

const PacksIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>📦</Text>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Text style={[styles.tabIcon, { color }]}>👤</Text>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2B5CE6',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: HomeIcon,
          title: 'Home'
        }}
      />
      
      <Tab.Screen 
        name="Practice" 
        component={PracticeScreen}
        options={{
          tabBarIcon: PracticeIcon,
          title: 'Practice'
        }}
      />

      <Tab.Screen 
        name="Exam" 
        component={ExamEngineScreen}
        options={{
          tabBarIcon: ExamIcon,
          title: 'Active Exam'
        }}
      />
      
      <Tab.Screen 
        name="Tips" 
        component={TipsScreen}
        options={{
          tabBarIcon: TipsIcon,
          title: 'Tips'
        }}
      />

      <Tab.Screen 
        name="Packs" 
        component={PacksScreen}
        options={{
          tabBarIcon: PacksIcon,
          title: 'Content Packs'
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ProfileIcon,
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 18,
  },
});

export default TabNavigator;
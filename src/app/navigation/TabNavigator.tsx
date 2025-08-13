import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../features/home/HomeScreen';
import PracticeScreen from '../../features/practice/PracticeScreen';
import ExamScreen from '../../features/exam/ExamScreen';
import TipsScreen from '../../features/tips/TipsScreen';
import ProfileScreen from '../../features/profile/ProfileScreen';
import PacksScreen from '../../features/content-packs/PacksScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2B5CE6',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Exam" component={ExamScreen} />
      <Tab.Screen name="Packs" component={PacksScreen} />
      <Tab.Screen name="Tips" component={TipsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

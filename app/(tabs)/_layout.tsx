/**
 * Tab Layout - Localized UI
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Target, Trophy, MessageCircle, User, Gem } from 'lucide-react-native';
import i18n from '../../src/i18n';
import { useTheme } from '../../src/context/ThemeContext';

const COLORS = {
  bg: '#FFFFFF',
  primary: '#2ECC71',
  inactive: '#BDC3C7',
  border: '#E8ECEF',
  ruby: '#E0115F',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Calculate proper tab bar height with safe area
  const tabBarHeight = 84 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background.secondary,
          borderTopWidth: 1,
          borderTopColor: theme.border.light,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? '#6B7280' : COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={24}
              color={color}
              fill={focused ? color : 'transparent'}
              strokeWidth={2.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: i18n.t('tabs.shop'),
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Gem
                size={24}
                color={color}
                fill={focused ? color : 'transparent'}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: i18n.t('tabs.quests'),
          tabBarIcon: ({ color }) => <Target size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: i18n.t('tabs.league'),
          tabBarIcon: ({ color, focused }) => (
            <Trophy
              size={24}
              color={focused ? COLORS.ruby : color}
              fill={focused ? COLORS.ruby : 'transparent'}
              strokeWidth={2.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: i18n.t('tabs.social'),
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.t('tabs.profile'),
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}

/**
 * NEURALIS - Main App Entry
 * 
 * This is the root component of the application. It handles:
 * 1. Initial resource loading (simulated or real).
 * 2. Displaying a branded splash screen during loading.
 * 3. Setting up the global contexts (SafeArea, GestureHandler).
 * 4. Navigation using Expo Router (via <Slot />).
 */

import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot } from 'expo-router';

import { MotiView, MotiText } from 'moti';

import { COLORS, TYPOGRAPHY, SPACING } from './src/constants/theme';

export default function App() {
  // State to track if the app is ready to render the main content
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Pre-load critical resources during splash screen.
        // Add font loading, asset prefetching, or cached data hydration here.
        // Minimum 500ms ensures splash is visible even on fast devices.
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 500)),
          // Future: Font.loadAsync({ ... }),
          // Future: Asset.loadAsync([...]),
        ]);
      } catch (e) {
        if (__DEV__) console.warn('Error loading app resources:', e);
      } finally {
        setIsAppReady(true);
      }
    };

    prepareApp();
  }, []);

  // ---------------------------------------------------------------------------
  // RENDER: Loading Screen
  // ---------------------------------------------------------------------------
  if (!isAppReady) {
    return (
      <MotiView 
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 800 }}
        style={styles.loadingContainer}
      >
        <StatusBar style="dark" backgroundColor={COLORS.background.primary} />

        {/* Background gradient for a premium feel */}
        <LinearGradient
          colors={[COLORS.background.secondary, COLORS.background.primary]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.loadingContent}>
          {/* Brand Logo Area with Pulse Animation */}
          <MotiView
            from={{ scale: 0.9, translateY: 10 }}
            animate={{ scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 10, mass: 1, repeatReverse: true, loop: true }}
            style={styles.logoContainer}
          >
            <Text style={styles.brandEmoji}>🦊</Text>
            <MotiView 
              from={{ opacity: 0.1, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1.2 }}
              transition={{ type: 'timing', duration: 1500, loop: true, repeatReverse: true }}
              style={styles.logoGlowEffect} 
            />
          </MotiView>

          {/* App Name & Tagline */}
          <MotiText 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000, delay: 300 }}
            style={styles.appName}
          >
            NEURALIS
          </MotiText>
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 1000, delay: 600 }}
            style={styles.appTagline}
          >
            Personalized Learning
          </MotiText>

          {/* Loading Indicator */}
          <ActivityIndicator
            size="large"
            color={COLORS.fox.orange}
            style={styles.spinner}
          />

          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 800 }}
            style={styles.loadingStatusText}
          >
            Loading AI lesson system...
          </MotiText>
        </View>
      </MotiView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Main App
  // ---------------------------------------------------------------------------
  return (
    <GestureHandlerRootView style={styles.appRoot}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.background.primary} />

        {/* Expo Router Slot: Renders the current route */}
        <Slot />

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Styles for the App component.
 * Uses constants from the theme for consistency.
 */
const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  logoGlowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.fox.orange,
    opacity: 0.2, // Subtle glow
  },
  brandEmoji: {
    fontSize: 80,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSize.title,
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: COLORS.text.primary,
    letterSpacing: 6,
    marginBottom: SPACING.xs,
  },
  appTagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.fox.orange,
    letterSpacing: 2,
    marginBottom: SPACING.xl,
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  loadingStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
});

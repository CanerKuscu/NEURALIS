/**
 * NEURALIS - Offline Banner
 *
 * Displays a subtle banner when the device is offline.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../hooks/useOffline';

export function OfflineBanner() {
  const { isOnline, queueSize } = useOffline();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        📡 Çevrimdışısınız{queueSize > 0 ? ` • ${queueSize} işlem bekliyor` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B35',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

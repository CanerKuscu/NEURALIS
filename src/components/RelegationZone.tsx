/**
 * RelegationZone - Düşme Dilimi Separator
 * Shows warning for users in relegation zone
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronDown, AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface RelegationZoneProps {
  label?: string;
}

const RelegationZone: React.FC<RelegationZoneProps> = ({ label = 'DÜŞME DİLİMİ' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.labelContainer}>
        <ChevronDown size={16} color="#FF4B4B" />
        <Text style={styles.label}>{label}</Text>
        <ChevronDown size={16} color="#FF4B4B" />
      </View>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,75,75,0.3)',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FF4B4B',
    letterSpacing: 1,
  },
});

export default RelegationZone;

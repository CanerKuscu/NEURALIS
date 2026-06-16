import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BadgeProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  achieved?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ icon, label, achieved }) => (
  <View style={[styles.badge, achieved && styles.achieved]}>
    <MaterialCommunityIcons name={icon} size={32} color={achieved ? '#ffd700' : '#fff'} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(160,32,240,0.12)',
    borderRadius: 18,
    padding: 14,
    margin: 8,
    width: 84,
    shadowColor: '#A020F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  achieved: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

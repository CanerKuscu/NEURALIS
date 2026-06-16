import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsPanelProps {
  stats: { level: number; lp: number; streak: number; rank: string };
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => (
  <View style={styles.panel}>
    <Text style={styles.label}>
      Seviye: <Text style={styles.value}>{stats.level}</Text>
    </Text>
    <Text style={styles.label}>
      LP: <Text style={styles.value}>{stats.lp}</Text>
    </Text>
    <Text style={styles.label}>
      Streak: <Text style={styles.value}>{stats.streak} gün</Text>
    </Text>
    <Text style={styles.label}>
      Rank: <Text style={styles.value}>{stats.rank}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    width: 260,
    alignSelf: 'center',
  },
  label: {
    color: '#cbd5e1',
    fontSize: 15,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DailyQuestCardProps {
    quest: { title: string; description: string; reward: string; completed: boolean };
}

export const DailyQuestCard: React.FC<DailyQuestCardProps> = ({ quest }) => (
    <View style={[styles.card, quest.completed && styles.completed]}>
        <MaterialCommunityIcons name="calendar-check" size={32} color={quest.completed ? '#4ade80' : '#fff'} />
        <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>{quest.title}</Text>
            <Text style={styles.desc}>{quest.description}</Text>
            <Text style={styles.reward}>Ödül: {quest.reward}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2d1a4d',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
    },
    completed: {
        backgroundColor: '#1e293b',
        opacity: 0.7,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    desc: {
        color: '#cbd5e1',
        fontSize: 14,
        marginTop: 2,
    },
    reward: {
        color: '#ffd700',
        fontSize: 14,
        marginTop: 4,
    },
});

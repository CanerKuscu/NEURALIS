import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DUO_COLORS, DUO_RADIUS } from '../../theme/duo';

export function DuoProgressBar({
    value,
    style,
}: {
    value: number; // 0..1
    style?: ViewStyle;
}): React.JSX.Element {
    const clamped = Math.max(0, Math.min(1, value));
    return (
        <View style={[styles.track, style]}>
            <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: 10,
        borderRadius: DUO_RADIUS.full,
        backgroundColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: DUO_RADIUS.full,
        backgroundColor: DUO_COLORS.blue,
    },
});


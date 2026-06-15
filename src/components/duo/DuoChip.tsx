import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { DUO_COLORS, DUO_RADIUS } from '../../theme/duo';

export function DuoChip({
    label,
    selected,
    onPress,
    style,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    style?: ViewStyle;
}): React.JSX.Element {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.base, selected ? styles.selected : styles.unselected, style]}
        >
            <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: DUO_RADIUS.full,
        borderWidth: 1,
    },
    selected: {
        backgroundColor: 'rgba(88,204,2,0.12)',
        borderColor: 'rgba(88,204,2,0.35)',
    },
    unselected: {
        backgroundColor: DUO_COLORS.bg,
        borderColor: DUO_COLORS.border,
    },
    text: {
        fontWeight: '900',
        fontSize: 13,
    },
    textSelected: {
        color: '#2B2B2B',
    },
    textUnselected: {
        color: DUO_COLORS.textPrimary,
    },
});


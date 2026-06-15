import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DUO_COLORS, DUO_RADIUS, DUO_SHADOW } from '../../theme/duo';

export function DuoCard({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: ViewStyle;
}): React.JSX.Element {
    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: DUO_COLORS.bgCard,
        borderRadius: DUO_RADIUS.xl,
        borderWidth: 1,
        borderColor: DUO_COLORS.border,
        padding: 16,
        ...DUO_SHADOW,
    },
});


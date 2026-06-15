import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'highlight' | 'dark';
    intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default',
    intensity = 20
}) => {
    const { theme } = useTheme();

    const getGradientColors = () => {
        switch (variant) {
            case 'highlight':
                return [`${theme.primary}40`, 'transparent'];
            case 'dark':
                return ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)'];
            default:
                return ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'];
        }
    };

    return (
        <View style={[
            styles.container,
            { borderColor: theme.border.light },
            style
        ]}>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background.tertiary, opacity: 0.9 }]} />
            )}

            <LinearGradient
                colors={getGradientColors() as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    content: {
        padding: 20,
        zIndex: 1,
    }
});

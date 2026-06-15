import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    runOnJS
} from 'react-native-reanimated';
import { COLORS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

interface SplashViewProps {
    onFinish: () => void;
}

export default function SplashView({ onFinish }: SplashViewProps) {
    const foxScale = useSharedValue(0.8); // Start slightly smaller or matching native
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Hide Native Splash Screen smoothly once this view is mounted
        const hideNativeSplash = async () => {
            await SplashScreen.hideAsync();
        };
        hideNativeSplash();

        // 1. Fox Animation - Gentle pulse/pop to settle
        foxScale.value = withSpring(1, { damping: 15, stiffness: 100 });

        // 2. Text Fade In
        textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

        // 3. Exit sequence
        const timeout = setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            });
        }, 2200);

        return () => clearTimeout(timeout);
    }, []);

    const foxStyle = useAnimatedStyle(() => ({
        transform: [{ scale: foxScale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20) }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.content, foxStyle]}>
                <Text style={styles.foxEmoji}>🦊</Text>
            </Animated.View>
            <Animated.Text style={[styles.title, textStyle]}>NEURALIS</Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.primary, // Matches native splash background
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    content: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    foxEmoji: {
        fontSize: 120,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
});

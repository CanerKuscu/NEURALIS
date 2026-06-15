/**
 * Language Selection Screen
 * Shown on first app launch before authentication
 * 33 languages displayed in a beautiful grid
 */

import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Globe } from 'lucide-react-native';
import { SUPPORTED_LANGUAGES, setLanguage } from '../src/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_MARGIN = 6;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_MARGIN * 2 * COLUMN_COUNT) / COLUMN_COUNT;

const LANGUAGE_SELECTED_KEY = '@neuralis_language_selected';

const COLORS = {
    bg: '#0F1A20',
    card: '#1A2C34',
    cardSelected: '#1E3A45',
    primary: '#58CC02',
    primaryDark: '#4CAD02',
    text: '#FFFFFF',
    textSecondary: '#AFAFAF',
    border: '#2A3D46',
    borderSelected: '#58CC02',
    accent: '#1CB0F6',
};

interface LanguageItemProps {
    item: typeof SUPPORTED_LANGUAGES[0];
    isSelected: boolean;
    onPress: (code: string) => void;
    index: number;
}

const LanguageItem = React.memo(({ item, isSelected, onPress, index }: LanguageItemProps) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.95, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 10 });
        });
        onPress(item.code);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 30).springify()}
            style={animStyle}
        >
            <TouchableOpacity
                style={[
                    styles.languageCard,
                    isSelected && styles.languageCardSelected,
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Check size={12} color="#FFF" />
                    </View>
                )}
                <Text style={styles.flag}>{item.flag}</Text>
                <Text
                    style={[styles.langName, isSelected && styles.langNameSelected]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
                <Text style={styles.langCode}>{item.code.toUpperCase()}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
});

export default function LanguageSelectScreen() {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<string>('en');

    const handleSelect = useCallback((code: string) => {
        setSelected(code);
    }, []);

    const handleContinue = async () => {
        // Save language preference
        setLanguage(selected);
        await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, selected);
        await AsyncStorage.setItem('app_language', selected);

        // Navigate to auth
        router.replace('/(auth)/login');
    };

    const renderItem = useCallback(({ item, index }: { item: typeof SUPPORTED_LANGUAGES[0]; index: number }) => (
        <LanguageItem
            item={item}
            isSelected={selected === item.code}
            onPress={handleSelect}
            index={index}
        />
    ), [selected, handleSelect]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* Background gradient */}
            <LinearGradient
                colors={['#0F1A20', '#162028', '#1A2830']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
                <View style={styles.globeContainer}>
                    <LinearGradient
                        colors={['#58CC02', '#4CAD02']}
                        style={styles.globeBg}
                    >
                        <Globe size={32} color="#FFF" />
                    </LinearGradient>
                </View>

                <Animated.Text entering={FadeInUp.delay(200)} style={styles.title}>
                    Choose your language
                </Animated.Text>
                <Animated.Text entering={FadeInUp.delay(300)} style={styles.subtitle}>
                    Dilinizi seçin  •  Select your language
                </Animated.Text>
            </Animated.View>

            {/* Language Grid */}
            <FlatList
                data={SUPPORTED_LANGUAGES}
                renderItem={renderItem}
                keyExtractor={item => item.code}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.row}
            />

            {/* Continue Button */}
            <Animated.View
                entering={FadeInUp.delay(400)}
                style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}
            >
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#58CC02', '#4CAD02']}
                        style={styles.continueGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.continueText}>Continue</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    globeContainer: {
        marginBottom: 16,
    },
    globeBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'center',
    },
    languageCard: {
        width: CARD_WIDTH,
        height: 90,
        backgroundColor: COLORS.card,
        borderRadius: 14,
        margin: CARD_MARGIN,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        position: 'relative',
    },
    languageCardSelected: {
        backgroundColor: COLORS.cardSelected,
        borderColor: COLORS.borderSelected,
        borderWidth: 2,
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flag: {
        fontSize: 28,
        marginBottom: 4,
    },
    langName: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    langNameSelected: {
        color: COLORS.primary,
    },
    langCode: {
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: 'rgba(15, 26, 32, 0.95)',
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    continueGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
});

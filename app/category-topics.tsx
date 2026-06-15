/**
 * NEURALIS - Category Topics Screen
 * Shows subcategories for a selected main category
 * Each subcategory shows level badge if user has completed placement test
 */

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Dimensions, StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, BookOpen, Lock, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../src/config/supabase';
import { useTheme } from '../src/context/ThemeContext';
import { getCategoryById, buildSubjectKey } from '../src/data/categories';
import type { SubCategory } from '../src/data/categories';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

// Level badge colors
const LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    beginner: { bg: '#43E97B20', text: '#2ECC71', label: i18n.t('category.beginner') },
    intermediate: { bg: '#4FACFE20', text: '#4FACFE', label: 'Orta' },
    advanced: { bg: '#FA709A20', text: '#FA709A', label: i18n.t('category.advanced') },
};

export default function CategoryTopicsScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const { category } = useLocalSearchParams<{ category: string }>();

    const [userLevels, setUserLevels] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const categoryData = getCategoryById(category || '');

    // Load user's levels for all subcategories in this category
    useFocusEffect(
        useCallback(() => {
            loadUserLevels();
        }, [category])
    );

    const loadUserLevels = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id || !categoryData) return;

            const subIds = categoryData.subcategories.map(sc =>
                buildSubjectKey(category!, sc.id)
            );

            const { data } = await supabase
                .from('user_category_levels')
                .select('category, level')
                .eq('user_id', session.user.id)
                .in('category', subIds);

            if (data) {
                const levels: Record<string, string> = {};
                data.forEach(row => {
                    levels[row.category] = row.level;
                });
                setUserLevels(levels);
            }
        } catch (err) {
            console.warn('Failed to load user levels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTopicPress = (sub: SubCategory) => {
        const subjectKey = buildSubjectKey(category!, sub.id);
        router.push({
            pathname: '/lesson',
            params: { subject: subjectKey },
        });
    };

    if (!categoryData) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <Text style={{ color: theme.text.primary, textAlign: 'center', marginTop: 100 }}>
                    Kategori bulunamadı
                </Text>
            </View>
        );
    }

    const CategoryIcon = categoryData.icon;

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* HEADER */}
            <LinearGradient
                colors={categoryData.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerIconBox}>
                        <CategoryIcon size={36} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{categoryData.titleTR}</Text>
                        <Text style={styles.headerSubtitle}>{categoryData.subtitle}</Text>
                    </View>
                </View>
                <Text style={styles.topicCount}>
                    {categoryData.subcategories.length} konu
                </Text>
            </LinearGradient>

            {/* SUBCATEGORY LIST */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {categoryData.subcategories.map((sub, index) => {
                    const subjectKey = buildSubjectKey(category!, sub.id);
                    const userLevel = userLevels[subjectKey];
                    const levelInfo = userLevel ? LEVEL_COLORS[userLevel] : null;

                    return (
                        <Animated.View
                            key={sub.id}
                            entering={FadeInDown.delay(index * 80).springify()}
                        >
                            <TouchableOpacity
                                style={[styles.topicCard, { backgroundColor: theme.background.secondary }]}
                                activeOpacity={0.85}
                                onPress={() => handleTopicPress(sub)}
                            >
                                {/* Emoji circle */}
                                <View style={[styles.emojiCircle, { backgroundColor: `${sub.color}20` }]}>
                                    <Text style={styles.emoji}>{sub.emoji}</Text>
                                </View>

                                {/* Text content */}
                                <View style={styles.topicText}>
                                    <Text style={[styles.topicName, { color: theme.text.primary }]}>
                                        {sub.name}
                                    </Text>
                                    <Text style={[styles.topicDesc, { color: theme.text.secondary }]}>
                                        {sub.description}
                                    </Text>
                                </View>

                                {/* Level badge OR "new" indicator */}
                                {levelInfo ? (
                                    <View style={[styles.levelBadge, { backgroundColor: levelInfo.bg }]}>
                                        <CheckCircle size={12} color={levelInfo.text} />
                                        <Text style={[styles.levelText, { color: levelInfo.text }]}>
                                            {levelInfo.label}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={[styles.newBadge, { borderColor: sub.color }]}>
                                        <BookOpen size={14} color={sub.color} />
                                        <Text style={[styles.newText, { color: sub.color }]}>Başla</Text>
                                    </View>
                                )}

                                <ChevronRight size={20} color={theme.text.muted} />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    headerContent: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    headerIconBox: {
        width: 56, height: 56, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 26, fontWeight: '800', color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2,
    },
    topicCount: {
        fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600',
        marginTop: 12, textAlign: 'right',
    },

    // List
    listContent: {
        padding: 20,
    },

    // Topic Card
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        gap: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    emojiCircle: {
        width: 48, height: 48, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    topicText: {
        flex: 1,
    },
    topicName: {
        fontSize: 17, fontWeight: '700',
    },
    topicDesc: {
        fontSize: 13, marginTop: 2,
    },

    // Level Badge
    levelBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    },
    levelText: {
        fontSize: 11, fontWeight: '700',
    },

    // New Badge
    newBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        borderWidth: 1.5,
    },
    newText: {
        fontSize: 11, fontWeight: '700',
    },
});

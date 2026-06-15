/**
 * Beyin Haritası - Brain Map Screen
 * Kullanmadığın yeteneklerin "çürüdüğünü" görsel olarak gösterir
 */

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ScrollView,
    Dimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, Brain, AlertTriangle, Zap, RefreshCw, ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown, ZoomIn, FadeIn,
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import { brainMapService, BrainMapData, SkillNode, SkillHealth } from '../src/services/BrainMapService';
import i18n from '../src/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEALTH_COLORS: Record<SkillHealth, string> = {
    thriving: '#2ECC71',
    healthy: '#58CC02',
    fading: '#FFD700',
    decaying: '#FF9600',
    dead: '#FF4B4B',
};

const HEALTH_LABELS: Record<SkillHealth, string> = {
    thriving: 'Gelişiyor 🌱',
    healthy: 'Sağlıklı ✅',
    fading: 'Soluyor 🍂',
    decaying: 'Çürüyor ⚠️',
    dead: 'Ölü 💀',
};

export default function BrainMapScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();

    const [brainMap, setBrainMap] = useState<BrainMapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

    useEffect(() => {
        loadBrainMap();
    }, []);

    const loadBrainMap = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return;

            const data = await brainMapService.getBrainMap(session.user.id);
            setBrainMap(data);
        } catch (e) {
            console.error('BrainMap load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePracticeSkill = (skill: SkillNode) => {
        router.push({
            pathname: '/lesson',
            params: { subject: skill.name },
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary, paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
            </View>
        );
    }

    const mapSize = SCREEN_WIDTH - 40;
    const centerX = mapSize / 2;
    const centerY = mapSize / 2;
    const maxRadius = mapSize / 2 - 40;

    // Position skills in a circular layout
    const positionedSkills = (brainMap?.skills || []).map((skill, idx, arr) => {
        const angle = (2 * Math.PI * idx) / arr.length - Math.PI / 2;
        const radiusScale = 0.5 + (skill.health / 100) * 0.5;
        const r = maxRadius * radiusScale;
        return {
            ...skill,
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle),
            nodeRadius: 16 + (skill.health / 100) * 14,
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Beyin Haritası</Text>
                <TouchableOpacity onPress={loadBrainMap} style={styles.refreshBtn}>
                    <RefreshCw size={20} color={theme.text.secondary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Overall Health */}
                <Animated.View entering={FadeInDown} style={styles.overallSection}>
                    <LinearGradient
                        colors={
                            (brainMap?.overallHealth || 0) >= 60
                                ? ['#2ECC71', '#27AE60']
                                : (brainMap?.overallHealth || 0) >= 30
                                    ? ['#FFD700', '#FF9600']
                                    : ['#FF4B4B', '#CC0000']
                        }
                        style={styles.overallCard}
                    >
                        <Brain size={40} color="#FFF" />
                        <Text style={styles.overallTitle}>Beyin Sağlığı</Text>
                        <Text style={styles.overallPercent}>{brainMap?.overallHealth || 0}%</Text>
                        <View style={styles.overallStats}>
                            <View style={styles.overallStat}>
                                <Text style={styles.overallStatValue}>{brainMap?.thrivingCount || 0}</Text>
                                <Text style={styles.overallStatLabel}>Sağlıklı</Text>
                            </View>
                            <View style={styles.overallStatDivider} />
                            <View style={styles.overallStat}>
                                <Text style={styles.overallStatValue}>{brainMap?.decayingCount || 0}</Text>
                                <Text style={styles.overallStatLabel}>Çürüyor</Text>
                            </View>
                            <View style={styles.overallStatDivider} />
                            <View style={styles.overallStat}>
                                <Text style={styles.overallStatValue}>{brainMap?.totalSkills || 0}</Text>
                                <Text style={styles.overallStatLabel}>Toplam</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Neural Map Visualization */}
                <View style={styles.mapContainer}>
                    <Svg width={mapSize} height={mapSize}>
                        {/* Connection lines to center */}
                        {positionedSkills.map((skill) => (
                            <Line
                                key={`line_${skill.skillId}`}
                                x1={centerX}
                                y1={centerY}
                                x2={skill.x}
                                y2={skill.y}
                                stroke={skill.color}
                                strokeWidth={1.5}
                                strokeOpacity={skill.opacity * 0.4}
                                strokeDasharray={skill.healthState === 'dead' ? '4,4' : 'none'}
                            />
                        ))}

                        {/* Center brain node */}
                        <Circle
                            cx={centerX}
                            cy={centerY}
                            r={28}
                            fill="#6C5CE7"
                            stroke="#FFF"
                            strokeWidth={3}
                        />
                        <SvgText
                            x={centerX}
                            y={centerY + 5}
                            fontSize="22"
                            fill="#FFF"
                            textAnchor="middle"
                        >
                            🧠
                        </SvgText>

                        {/* Skill nodes */}
                        {positionedSkills.map((skill) => (
                            <G key={skill.skillId}>
                                {/* Glow for thriving */}
                                {skill.healthState === 'thriving' && (
                                    <Circle
                                        cx={skill.x}
                                        cy={skill.y}
                                        r={skill.nodeRadius + 8}
                                        fill={`${skill.color}30`}
                                    />
                                )}
                                {/* Node */}
                                <Circle
                                    cx={skill.x}
                                    cy={skill.y}
                                    r={skill.nodeRadius}
                                    fill={skill.color}
                                    opacity={skill.opacity}
                                    stroke={HEALTH_COLORS[skill.healthState]}
                                    strokeWidth={2}
                                />
                                {/* Decay crack lines for dead/decaying */}
                                {(skill.healthState === 'dead' || skill.healthState === 'decaying') && (
                                    <>
                                        <Line
                                            x1={skill.x - 6}
                                            y1={skill.y - 4}
                                            x2={skill.x + 6}
                                            y2={skill.y + 4}
                                            stroke="#FF000080"
                                            strokeWidth={1.5}
                                        />
                                        <Line
                                            x1={skill.x - 4}
                                            y1={skill.y + 5}
                                            x2={skill.x + 4}
                                            y2={skill.y - 5}
                                            stroke="#FF000060"
                                            strokeWidth={1}
                                        />
                                    </>
                                )}
                                {/* Label */}
                                <SvgText
                                    x={skill.x}
                                    y={skill.y + skill.nodeRadius + 14}
                                    fontSize="10"
                                    fill={skill.healthState === 'dead' ? '#FF4B4B' : '#FFF'}
                                    textAnchor="middle"
                                    opacity={skill.opacity}
                                >
                                    {skill.nameTr}
                                </SvgText>
                            </G>
                        ))}
                    </Svg>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    {(Object.entries(HEALTH_COLORS) as [SkillHealth, string][]).map(([state, color]) => (
                        <View key={state} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: color }]} />
                            <Text style={[styles.legendText, { color: theme.text.secondary }]}>
                                {HEALTH_LABELS[state]}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Skill Details List */}
                <View style={styles.skillList}>
                    <Text style={[styles.skillListTitle, { color: theme.text.primary }]}>
                        Yetenek Detayları
                    </Text>

                    {/* Decaying skills first */}
                    {[...(brainMap?.skills || [])]
                        .sort((a, b) => a.health - b.health)
                        .filter(s => s.totalLessons > 0)
                        .map((skill, idx) => (
                            <Animated.View
                                key={skill.skillId}
                                entering={FadeInDown.delay(idx * 60)}
                            >
                                <TouchableOpacity
                                    style={[styles.skillCard, { backgroundColor: theme.background.secondary }]}
                                    onPress={() => handlePracticeSkill(skill)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.skillColorBar, { backgroundColor: skill.color, opacity: skill.opacity }]} />
                                    <View style={styles.skillInfo}>
                                        <Text style={[styles.skillName, { color: theme.text.primary }]}>{skill.nameTr}</Text>
                                        <View style={styles.skillMeta}>
                                            <View style={[styles.healthBadge, { backgroundColor: `${HEALTH_COLORS[skill.healthState]}20` }]}>
                                                <View style={[styles.healthDot, { backgroundColor: HEALTH_COLORS[skill.healthState] }]} />
                                                <Text style={[styles.healthText, { color: HEALTH_COLORS[skill.healthState] }]}>
                                                    {HEALTH_LABELS[skill.healthState]}
                                                </Text>
                                            </View>
                                            {skill.daysSinceLastPractice < 999 && (
                                                <Text style={[styles.daysSince, { color: theme.text.secondary }]}>
                                                    {skill.daysSinceLastPractice === 0
                                                        ? i18n.t('brain.today')
                                                        : `${skill.daysSinceLastPractice} gün önce`}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Health bar */}
                                    <View style={styles.healthBarContainer}>
                                        <View style={styles.healthBarBg}>
                                            <View
                                                style={[
                                                    styles.healthBarFill,
                                                    {
                                                        width: `${skill.health}%`,
                                                        backgroundColor: HEALTH_COLORS[skill.healthState],
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.healthPercent, { color: theme.text.secondary }]}>
                                            {Math.round(skill.health)}%
                                        </Text>
                                    </View>

                                    {/* Practice button for decaying skills */}
                                    {(skill.healthState === 'decaying' || skill.healthState === 'dead' || skill.healthState === 'fading') && (
                                        <View style={styles.practiceBtn}>
                                            <Zap size={14} color="#FFF" />
                                            <Text style={styles.practiceBtnText}>Canlandır</Text>
                                        </View>
                                    )}

                                    <ChevronRight size={20} color={theme.text.secondary} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}

                    {/* Skills not yet practiced */}
                    {(brainMap?.skills || []).filter(s => s.totalLessons === 0).length > 0 && (
                        <>
                            <Text style={[styles.untriedTitle, { color: theme.text.secondary }]}>
                                Henüz Keşfedilmemiş
                            </Text>
                            {(brainMap?.skills || [])
                                .filter(s => s.totalLessons === 0)
                                .map((skill, idx) => (
                                    <Animated.View key={skill.skillId} entering={FadeIn.delay(idx * 50)}>
                                        <TouchableOpacity
                                            style={[styles.untriedCard, { backgroundColor: theme.background.secondary }]}
                                            onPress={() => handlePracticeSkill(skill)}
                                        >
                                            <View style={[styles.untriedDot, { backgroundColor: skill.color }]} />
                                            <Text style={[styles.untriedName, { color: theme.text.secondary }]}>{skill.nameTr}</Text>
                                            <Text style={[styles.untriedAction, { color: theme.primary }]}>Keşfet →</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    refreshBtn: { padding: 8 },

    // Overall
    overallSection: { marginHorizontal: 20, marginBottom: 16 },
    overallCard: { borderRadius: 24, padding: 24, alignItems: 'center' },
    overallTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 8 },
    overallPercent: { fontSize: 48, fontWeight: '900', color: '#FFF' },
    overallStats: { flexDirection: 'row', marginTop: 16, gap: 0 },
    overallStat: { alignItems: 'center', paddingHorizontal: 20 },
    overallStatValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    overallStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    overallStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },

    // Map
    mapContainer: {
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 0,
    },

    // Legend
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 24,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, fontWeight: '600' },

    // Skill List
    skillList: { paddingHorizontal: 20 },
    skillListTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    skillCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        gap: 12,
    },
    skillColorBar: { width: 4, height: 44, borderRadius: 2 },
    skillInfo: { flex: 1 },
    skillName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    skillMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    healthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    healthDot: { width: 8, height: 8, borderRadius: 4 },
    healthText: { fontSize: 11, fontWeight: '700' },
    daysSince: { fontSize: 11 },
    healthBarContainer: { width: 60, alignItems: 'center', gap: 4 },
    healthBarBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
    healthBarFill: { height: '100%', borderRadius: 3 },
    healthPercent: { fontSize: 10, fontWeight: '700' },
    practiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FF9600',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    practiceBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

    // Untried
    untriedTitle: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
    untriedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        gap: 10,
    },
    untriedDot: { width: 12, height: 12, borderRadius: 6 },
    untriedName: { flex: 1, fontSize: 14, fontWeight: '600' },
    untriedAction: { fontSize: 13, fontWeight: '700' },
});

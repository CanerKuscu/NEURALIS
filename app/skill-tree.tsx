/**
 * NEURALIS - Skill Tree RPG Screen
 * Ön koşullu yetenek ağacı — konuları sırasıyla aç ve ilerle!
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, CheckCircle, Play, Star, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import type { SkillTree, SkillNode } from '../src/services/SkillTreeService';
import { skillTreeService } from '../src/services/SkillTreeService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TREE_HEIGHT = SCREEN_HEIGHT * 1.2;
const NODE_SIZE = 56;

const STATUS_COLORS = {
  locked: '#444',
  available: '#3498DB',
  'in-progress': '#F39C12',
  completed: '#2ECC71',
};

export default function SkillTreeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tree, setTree] = useState<SkillTree | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [userId, setUserId] = useState('');

  const categories = skillTreeService.getAvailableCategories();

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  const loadTree = async (category: string) => {
    setLoading(true);
    setSelectedCategory(category);
    const t = await skillTreeService.getTree(userId, category);
    setTree(t);
    setLoading(false);
  };

  const handleNodePress = (node: SkillNode) => {
    if (node.status === 'locked') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedNode(node);
  };

  const handleStartNode = () => {
    if (!selectedNode || !tree) return;
    router.push(
      `/lesson?category=${tree.category}&topic=${selectedNode.title}&skillNode=${selectedNode.id}`,
    );
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));

  // ─── CATEGORY SELECTION ───
  if (!selectedCategory) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <LinearGradient
          colors={['#2C3E50', '#3D566E']}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>🌳 Yetenek Ağacı</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.headerSub}>{i18n.t('skill_tree_screen.learn_sequential')}</Text>
        </LinearGradient>

        <View style={styles.catList}>
          {categories.map((cat, i) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(i * 100)}>
              <TouchableOpacity
                style={[styles.catCard, { backgroundColor: theme.background.secondary }]}
                onPress={() => loadTree(cat.id)}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catTitle, { color: theme.text.primary }]}>{cat.title}</Text>
                <Text style={[styles.catSub, { color: theme.text.secondary }]}>Yetenek Ağacı</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[styles.container, styles.center, { backgroundColor: theme.background.primary }]}
      >
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  if (!tree) return null;

  const completionPct = Math.round((tree.completedNodes / tree.totalNodes) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.treeHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.treeTitle, { color: theme.text.primary }]}>{tree.title}</Text>
        <Text style={[styles.treePct, { color: '#2ECC71' }]}>{completionPct}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ height: TREE_HEIGHT, paddingHorizontal: 16 }}
      >
        {/* Connection Lines */}
        <Svg style={StyleSheet.absoluteFill} width={SCREEN_WIDTH} height={TREE_HEIGHT}>
          {tree.nodes.map((node) =>
            node.prerequisites.map((preId) => {
              const pre = tree.nodes.find((n) => n.id === preId);
              if (!pre) return null;
              const fromX = pre.position.x * (SCREEN_WIDTH - 32) + NODE_SIZE / 2;
              const fromY = pre.position.y * TREE_HEIGHT + NODE_SIZE / 2;
              const toX = node.position.x * (SCREEN_WIDTH - 32) + NODE_SIZE / 2;
              const toY = node.position.y * TREE_HEIGHT + NODE_SIZE / 2;
              const color = node.status === 'locked' ? '#333' : STATUS_COLORS[node.status];
              return (
                <Line
                  key={`${preId}-${node.id}`}
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={node.status === 'locked' ? '6,4' : undefined}
                />
              );
            }),
          )}
        </Svg>

        {/* Nodes */}
        {tree.nodes.map((node, i) => {
          const left = node.position.x * (SCREEN_WIDTH - 32 - NODE_SIZE);
          const top = node.position.y * TREE_HEIGHT;
          const color = STATUS_COLORS[node.status];
          const isSelected = selectedNode?.id === node.id;

          return (
            <Animated.View
              key={node.id}
              entering={ZoomIn.delay(i * 50)}
              style={[styles.nodeContainer, { left, top }]}
            >
              <TouchableOpacity
                onPress={() => handleNodePress(node)}
                disabled={node.status === 'locked'}
                style={[
                  styles.nodeCircle,
                  {
                    borderColor: color,
                    backgroundColor: node.status === 'completed' ? color : 'rgba(0,0,0,0.6)',
                  },
                  isSelected && { borderWidth: 3 },
                ]}
              >
                {node.status === 'locked' ? (
                  <Lock size={18} color="#555" />
                ) : node.status === 'completed' ? (
                  <CheckCircle size={22} color="#FFF" />
                ) : node.status === 'available' ? (
                  <Animated.View style={pulseStyle}>
                    <Text style={styles.nodeIcon}>{node.icon}</Text>
                  </Animated.View>
                ) : (
                  <Text style={styles.nodeIcon}>{node.icon}</Text>
                )}
              </TouchableOpacity>
              <Text
                style={[
                  styles.nodeLabel,
                  { color: node.status === 'locked' ? '#555' : theme.text.primary },
                ]}
                numberOfLines={1}
              >
                {node.title}
              </Text>

              {/* Progress ring for in-progress */}
              {node.status === 'in-progress' && (
                <View style={[styles.progressRing, { borderColor: '#F39C12' }]}>
                  <Text style={styles.progressRingText}>{node.progress}%</Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Selected Node Detail */}
      {selectedNode && (
        <Animated.View
          entering={FadeInDown}
          style={[styles.nodeDetail, { backgroundColor: theme.background.secondary }]}
        >
          <View style={styles.nodeDetailHeader}>
            <Text style={styles.nodeDetailIcon}>{selectedNode.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nodeDetailTitle, { color: theme.text.primary }]}>
                {selectedNode.title}
              </Text>
              <Text style={[styles.nodeDetailDesc, { color: theme.text.secondary }]}>
                {selectedNode.description}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)}>
              <Text style={{ color: theme.text.secondary, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nodeDetailMeta}>
            <View style={styles.detailBadge}>
              <Star size={14} color="#FFD700" />
              <Text style={styles.detailBadgeText}>Seviye {selectedNode.level}</Text>
            </View>
            <View style={styles.detailBadge}>
              <Zap size={14} color="#2ECC71" />
              <Text style={styles.detailBadgeText}>+{selectedNode.rewards.xp} XP</Text>
            </View>
            {selectedNode.rewards.badge && (
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>🏅 {selectedNode.rewards.badge}</Text>
              </View>
            )}
          </View>

          {selectedNode.status !== 'completed' && (
            <TouchableOpacity style={styles.startNodeBtn} onPress={handleStartNode}>
              <Play size={18} color="#FFF" />
              <Text style={styles.startNodeBtnText}>
                {selectedNode.status === 'in-progress'
                  ? i18n.t('skill_tree_screen.continue_btn')
                  : i18n.t('skill_tree_screen.start_btn')}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8 },

  catList: { padding: 20, gap: 16 },
  catCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  catEmoji: { fontSize: 48 },
  catTitle: { fontSize: 20, fontWeight: '800' },
  catSub: { fontSize: 13, fontWeight: '600' },

  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  treeTitle: { fontSize: 16, fontWeight: '700' },
  treePct: { fontSize: 15, fontWeight: '800' },

  progressBar: {
    height: 4,
    backgroundColor: '#222',
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 2 },

  nodeContainer: { position: 'absolute', alignItems: 'center', width: NODE_SIZE + 20 },
  nodeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIcon: { fontSize: 22 },
  nodeLabel: { fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  progressRing: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: { fontSize: 7, fontWeight: '800', color: '#F39C12' },

  nodeDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  nodeDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nodeDetailIcon: { fontSize: 36 },
  nodeDetailTitle: { fontSize: 18, fontWeight: '800' },
  nodeDetailDesc: { fontSize: 13, marginTop: 2 },
  nodeDetailMeta: { flexDirection: 'row', gap: 8 },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailBadgeText: { color: '#CCC', fontSize: 12, fontWeight: '600' },
  startNodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2ECC71',
    borderRadius: 16,
    padding: 16,
  },
  startNodeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

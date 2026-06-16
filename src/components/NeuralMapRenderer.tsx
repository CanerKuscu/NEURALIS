// NeuralMapRenderer.tsx
// Candy Crush-style scrolling neural map (SVG-based)
// Virtualized: only renders nodes visible on screen + buffer

import React, { useState, useCallback, useMemo } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, G } from 'react-native-svg';

const TOTAL_LEVELS = 5000;
const CLUSTERS = [
  { name: 'Frontal Lobe', color: '#A020F0' },
  { name: 'Hippocampus', color: '#FFD700' },
  { name: 'Prefrontal Cortex', color: '#FF1744' },
];

const LEVELS_PER_CLUSTER = 1000;
const NODE_SPACING = 8;
const NODE_RADIUS = 18;
const MAP_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = 100 + TOTAL_LEVELS * NODE_SPACING;
const VIEWPORT_HEIGHT = Dimensions.get('window').height;
const RENDER_BUFFER = 400; // render 400px above/below viewport

function getNodePosition(i: number) {
  return { x: 60 + 200 * Math.sin(i / 20), y: 100 + i * NODE_SPACING };
}

export const NeuralMapRenderer: React.FC<{ currentLevel: number; streakDecay: number }> =
  React.memo(({ currentLevel, streakDecay }) => {
    const [scrollY, setScrollY] = useState(0);

    const bgColor = streakDecay > 0.7 ? '#A020F0' : streakDecay > 0.3 ? '#FFD700' : '#FF1744';

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollY(e.nativeEvent.contentOffset.y);
    }, []);

    // Only render nodes within viewport + buffer
    const visibleNodes = useMemo(() => {
      const minY = scrollY - RENDER_BUFFER;
      const maxY = scrollY + VIEWPORT_HEIGHT + RENDER_BUFFER;
      const startIdx = Math.max(0, Math.floor((minY - 100) / NODE_SPACING));
      const endIdx = Math.min(TOTAL_LEVELS - 1, Math.ceil((maxY - 100) / NODE_SPACING));

      const nodes = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const clusterIdx = Math.floor(i / LEVELS_PER_CLUSTER) % CLUSTERS.length;
        const { x, y } = getNodePosition(i);
        nodes.push(
          <G key={i}>
            <Circle
              cx={x}
              cy={y}
              r={NODE_RADIUS}
              fill={i === currentLevel ? '#FFD700' : CLUSTERS[clusterIdx].color}
              stroke="#fff"
              strokeWidth={i % 100 === 0 ? 4 : 2}
            />
            {i % 1000 === 0 && (
              <SvgText x={x + 40} y={y + 8} fontSize="18" fill="#fff">
                {CLUSTERS[clusterIdx].name}
              </SvgText>
            )}
          </G>,
        );
      }
      return nodes;
    }, [scrollY, currentLevel]);

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={{ height: MAP_HEIGHT }}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        removeClippedSubviews
      >
        <Svg height={MAP_HEIGHT} width={MAP_WIDTH}>
          <Path
            d="M60,100 Q160,200 60,300 Q160,400 60,500"
            stroke="#fff"
            strokeWidth="6"
            fill="none"
          />
          {visibleNodes}
        </Svg>
      </ScrollView>
    );
  });

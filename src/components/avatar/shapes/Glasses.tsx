/**
 * Glasses SVG Component
 */
import React from 'react';
import { Path, G, Circle, Rect } from 'react-native-svg';
import type { AvatarConfig } from '../../../types/avatar';

interface GlassesProps {
  variant: AvatarConfig['glasses'];
}

export const AvatarGlasses: React.FC<GlassesProps> = ({ variant }) => {
  if (!variant || variant === 'none') return null;

  const glassesStyles: Record<string, React.ReactElement | null> = {
    round: (
      <G>
        {/* Round glasses */}
        <Circle cx="65" cy="82" r="20" stroke="#333" strokeWidth="3" fill="none" />
        <Circle cx="135" cy="82" r="20" stroke="#333" strokeWidth="3" fill="none" />
        {/* Bridge */}
        <Path d="M85 82 Q100 78, 115 82" stroke="#333" strokeWidth="3" fill="none" />
        {/* Temples */}
        <Path d="M45 82 L35 75" stroke="#333" strokeWidth="3" />
        <Path d="M155 82 L165 75" stroke="#333" strokeWidth="3" />
      </G>
    ),
    square: (
      <G>
        {/* Square glasses */}
        <Rect
          x="45"
          y="68"
          width="40"
          height="30"
          rx="4"
          stroke="#333"
          strokeWidth="3"
          fill="none"
        />
        <Rect
          x="115"
          y="68"
          width="40"
          height="30"
          rx="4"
          stroke="#333"
          strokeWidth="3"
          fill="none"
        />
        {/* Bridge */}
        <Path d="M85 83 L115 83" stroke="#333" strokeWidth="3" />
        {/* Temples */}
        <Path d="M45 75 L32 70" stroke="#333" strokeWidth="3" />
        <Path d="M155 75 L168 70" stroke="#333" strokeWidth="3" />
      </G>
    ),
    sunglasses: (
      <G>
        {/* Sunglasses with dark lenses */}
        <Path
          d="M42 70 Q45 62, 65 62 Q85 62, 88 70 Q88 95, 65 98 Q42 95, 42 70"
          fill="#222"
          stroke="#111"
          strokeWidth="2"
        />
        <Path
          d="M112 70 Q115 62, 135 62 Q155 62, 158 70 Q158 95, 135 98 Q112 95, 112 70"
          fill="#222"
          stroke="#111"
          strokeWidth="2"
        />
        {/* Bridge */}
        <Path d="M88 75 Q100 70, 112 75" stroke="#111" strokeWidth="3" fill="none" />
        {/* Temples */}
        <Path d="M42 72 L28 68" stroke="#111" strokeWidth="4" />
        <Path d="M158 72 L172 68" stroke="#111" strokeWidth="4" />
        {/* Lens shine */}
        <Path d="M50 75 Q55 72, 60 75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
        <Path
          d="M120 75 Q125 72, 130 75"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          fill="none"
        />
      </G>
    ),
  };

  return glassesStyles[variant] || null;
};

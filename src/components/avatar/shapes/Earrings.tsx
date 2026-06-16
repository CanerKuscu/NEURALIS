/**
 * Earrings SVG Component
 */
import React from 'react';
import { Path, G, Circle } from 'react-native-svg';
import type { AvatarConfig } from '../../../types/avatar';

interface EarringsProps {
  variant: AvatarConfig['earrings'];
  color?: string;
}

export const AvatarEarrings: React.FC<EarringsProps> = ({ variant, color = '#FFD700' }) => {
  if (!variant || variant === 'none') return null;

  const earringStyles: Record<string, React.ReactElement | null> = {
    stud: (
      <G>
        {/* Simple stud earrings */}
        <Circle cx="38" cy="105" r="5" fill={color} stroke="#DAA520" strokeWidth="1" />
        <Circle cx="162" cy="105" r="5" fill={color} stroke="#DAA520" strokeWidth="1" />
      </G>
    ),
    hoop: (
      <G>
        {/* Hoop earrings */}
        <Circle cx="35" cy="112" r="12" stroke={color} strokeWidth="3" fill="none" />
        <Circle cx="165" cy="112" r="12" stroke={color} strokeWidth="3" fill="none" />
      </G>
    ),
    drop: (
      <G>
        {/* Drop/dangle earrings */}
        <Circle cx="38" cy="105" r="3" fill={color} />
        <Path d="M38 108 L38 125" stroke={color} strokeWidth="2" />
        <Circle cx="38" cy="130" r="6" fill={color} stroke="#DAA520" strokeWidth="1" />

        <Circle cx="162" cy="105" r="3" fill={color} />
        <Path d="M162 108 L162 125" stroke={color} strokeWidth="2" />
        <Circle cx="162" cy="130" r="6" fill={color} stroke="#DAA520" strokeWidth="1" />
      </G>
    ),
  };

  return earringStyles[variant] || null;
};

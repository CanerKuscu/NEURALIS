/**
 * Duolingo-Style Human Head - Minimalist, rounded, cute design
 */
import React from 'react';
import { G, Ellipse, Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

export type HeadShape = 'oval' | 'round' | 'square' | 'heart' | 'long';

interface HumanHeadProps {
  shape?: HeadShape;
  skinColor: string;
}

export const HumanHead: React.FC<HumanHeadProps> = ({ shape = 'oval', skinColor }) => {
  const darkerSkin = adjustColor(skinColor, -15);
  const lighterSkin = adjustColor(skinColor, 25);

  // All shapes are similar but with slight variations - Duolingo style is consistent
  const getHeadDimensions = () => {
    switch (shape) {
      case 'round':
        return { rx: 52, ry: 52, cy: 82 };
      case 'square':
        return { rx: 48, ry: 48, cy: 82 };
      case 'heart':
        return { rx: 50, ry: 48, cy: 80 };
      case 'long':
        return { rx: 45, ry: 55, cy: 82 };
      case 'oval':
      default:
        return { rx: 48, ry: 52, cy: 82 };
    }
  };

  const dims = getHeadDimensions();

  return (
    <G>
      <Defs>
        <RadialGradient id="skinGradient" cx="40%" cy="30%" r="60%">
          <Stop offset="0%" stopColor={lighterSkin} />
          <Stop offset="100%" stopColor={skinColor} />
        </RadialGradient>
      </Defs>

      {/* Main head - simple smooth ellipse */}
      <Ellipse cx="100" cy={dims.cy} rx={dims.rx} ry={dims.ry} fill="url(#skinGradient)" />

      {/* Simple ears - Duolingo style: small, rounded */}
      <Ellipse cx={100 - dims.rx - 3} cy={dims.cy} rx="7" ry="10" fill={skinColor} />
      <Ellipse cx={100 + dims.rx + 3} cy={dims.cy} rx="7" ry="10" fill={skinColor} />

      {/* Inner ear shadow */}
      <Ellipse cx={100 - dims.rx - 3} cy={dims.cy} rx="4" ry="6" fill={darkerSkin} opacity={0.4} />
      <Ellipse cx={100 + dims.rx + 3} cy={dims.cy} rx="4" ry="6" fill={darkerSkin} opacity={0.4} />
    </G>
  );
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default HumanHead;

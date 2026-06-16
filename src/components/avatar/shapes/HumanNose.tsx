/**
 * Duolingo-Style Human Nose - Minimal, subtle
 */
import React from 'react';
import { G, Path, Ellipse, Circle } from 'react-native-svg';

export type NoseStyle = 'small' | 'medium' | 'pointed' | 'button' | 'wide' | 'none';

interface HumanNoseProps {
  style?: NoseStyle;
  skinColor: string;
}

export const HumanNose: React.FC<HumanNoseProps> = ({ style = 'small', skinColor }) => {
  const darkerSkin = adjustColor(skinColor, -25);
  const noseY = 92;
  const noseX = 100;

  const renderNose = () => {
    switch (style) {
      case 'none':
        return null;

      case 'medium':
        // Slightly larger nose
        return (
          <G>
            <Path
              d={`M${noseX},${noseY - 8} L${noseX + 6},${noseY + 4} L${noseX},${noseY + 2} L${noseX - 6},${noseY + 4} Z`}
              fill={darkerSkin}
              opacity={0.5}
            />
          </G>
        );

      case 'pointed':
        // Pointed nose
        return (
          <G>
            <Path
              d={`M${noseX},${noseY - 10} L${noseX + 5},${noseY + 5} L${noseX - 5},${noseY + 5} Z`}
              fill={darkerSkin}
              opacity={0.45}
            />
          </G>
        );

      case 'button':
        // Round button nose
        return (
          <G>
            <Circle cx={noseX} cy={noseY} r="6" fill={darkerSkin} opacity={0.4} />
            <Circle cx={noseX} cy={noseY - 1} r="4" fill={skinColor} opacity={0.5} />
          </G>
        );

      case 'wide':
        // Wider nose
        return (
          <G>
            <Path
              d={`M${noseX - 8},${noseY + 3} Q${noseX},${noseY - 2} ${noseX + 8},${noseY + 3}`}
              stroke={darkerSkin}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity={0.5}
            />
          </G>
        );

      case 'small':
      default:
        // Small subtle nose - Duolingo style (just a hint)
        return (
          <G>
            <Path
              d={`M${noseX - 4},${noseY + 2} Q${noseX},${noseY - 3} ${noseX + 4},${noseY + 2}`}
              stroke={darkerSkin}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity={0.45}
            />
          </G>
        );
    }
  };

  return <G>{renderNose()}</G>;
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default HumanNose;

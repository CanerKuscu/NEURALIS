/**
 * Duolingo-Style Human Mouth - Simple, expressive
 */
import React from 'react';
import { G, Path, Ellipse } from 'react-native-svg';

export type MouthStyle = 'smile' | 'grin' | 'neutral' | 'open' | 'smirk' | 'pout';

interface HumanMouthProps {
  style?: MouthStyle;
  lipColor?: string;
}

export const HumanMouth: React.FC<HumanMouthProps> = ({
  style = 'smile',
  lipColor = '#E57373',
}) => {
  const mouthY = 108;
  const mouthX = 100;

  const renderMouth = () => {
    switch (style) {
      case 'grin':
        // Big happy grin showing teeth
        return (
          <G>
            {/* Mouth opening */}
            <Path
              d={`M${mouthX - 18},${mouthY} Q${mouthX},${mouthY + 18} ${mouthX + 18},${mouthY}`}
              fill="#1A1A1A"
            />
            {/* Teeth */}
            <Path
              d={`M${mouthX - 15},${mouthY} L${mouthX + 15},${mouthY} L${mouthX + 12},${mouthY + 6} L${mouthX - 12},${mouthY + 6} Z`}
              fill="#FFF"
            />
            {/* Upper lip line */}
            <Path
              d={`M${mouthX - 18},${mouthY} Q${mouthX},${mouthY - 2} ${mouthX + 18},${mouthY}`}
              stroke={lipColor}
              strokeWidth="2.5"
              fill="none"
            />
          </G>
        );

      case 'neutral':
        // Simple neutral line
        return (
          <G>
            <Path
              d={`M${mouthX - 12},${mouthY} L${mouthX + 12},${mouthY}`}
              stroke={lipColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </G>
        );

      case 'open':
        // Surprised open mouth
        return (
          <G>
            {/* Open mouth shape */}
            <Ellipse cx={mouthX} cy={mouthY + 5} rx="12" ry="10" fill="#1A1A1A" />
            {/* Tongue hint */}
            <Ellipse cx={mouthX} cy={mouthY + 10} rx="8" ry="5" fill="#E57373" />
            {/* Lip outline */}
            <Ellipse
              cx={mouthX}
              cy={mouthY + 5}
              rx="12"
              ry="10"
              fill="none"
              stroke={lipColor}
              strokeWidth="2"
            />
          </G>
        );

      case 'smirk':
        // One-sided smirk
        return (
          <G>
            <Path
              d={`M${mouthX - 10},${mouthY + 2} Q${mouthX},${mouthY} ${mouthX + 12},${mouthY - 5}`}
              stroke={lipColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'pout':
        // Cute pout lips
        return (
          <G>
            {/* Upper lip */}
            <Path
              d={`M${mouthX - 10},${mouthY} Q${mouthX - 5},${mouthY - 4} ${mouthX},${mouthY - 2} Q${mouthX + 5},${mouthY - 4} ${mouthX + 10},${mouthY}`}
              fill={lipColor}
            />
            {/* Lower lip */}
            <Path
              d={`M${mouthX - 10},${mouthY} Q${mouthX},${mouthY + 8} ${mouthX + 10},${mouthY}`}
              fill={lipColor}
            />
          </G>
        );

      case 'smile':
      default:
        // Classic friendly smile
        return (
          <G>
            <Path
              d={`M${mouthX - 15},${mouthY} Q${mouthX},${mouthY + 12} ${mouthX + 15},${mouthY}`}
              stroke={lipColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );
    }
  };

  return <G>{renderMouth()}</G>;
};

export default HumanMouth;

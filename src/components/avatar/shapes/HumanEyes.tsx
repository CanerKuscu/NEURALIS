/**
 * Duolingo-Style Human Eyes - Big, expressive, cute
 */
import React from 'react';
import { G, Ellipse, Circle, Path } from 'react-native-svg';

export type EyeStyle = 'normal' | 'happy' | 'sleepy' | 'surprised' | 'wink' | 'cute';

interface HumanEyesProps {
  style?: EyeStyle;
  eyeColor?: string;
}

export const HumanEyes: React.FC<HumanEyesProps> = ({ style = 'normal', eyeColor = '#4A3728' }) => {
  // Eye positions - Duolingo style has big, centered eyes
  const leftX = 78;
  const rightX = 122;
  const eyeY = 78;

  const renderEyes = () => {
    switch (style) {
      case 'happy':
        // Happy closed eyes - curved lines
        return (
          <G>
            <Path
              d={`M${leftX - 12},${eyeY} Q${leftX},${eyeY - 8} ${leftX + 12},${eyeY}`}
              stroke="#1A1A1A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={`M${rightX - 12},${eyeY} Q${rightX},${eyeY - 8} ${rightX + 12},${eyeY}`}
              stroke="#1A1A1A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'sleepy':
        // Half-lidded sleepy eyes
        return (
          <G>
            {/* Eye whites */}
            <Ellipse cx={leftX} cy={eyeY + 2} rx="13" ry="8" fill="#FFF" />
            <Ellipse cx={rightX} cy={eyeY + 2} rx="13" ry="8" fill="#FFF" />
            {/* Pupils */}
            <Circle cx={leftX} cy={eyeY + 3} r="5" fill="#1A1A1A" />
            <Circle cx={rightX} cy={eyeY + 3} r="5" fill="#1A1A1A" />
            {/* Eyelids covering top */}
            <Path
              d={`M${leftX - 14},${eyeY - 2} L${leftX + 14},${eyeY - 2} L${leftX + 14},${eyeY - 8} L${leftX - 14},${eyeY - 8} Z`}
              fill="#F5D0C5"
            />
            <Path
              d={`M${rightX - 14},${eyeY - 2} L${rightX + 14},${eyeY - 2} L${rightX + 14},${eyeY - 8} L${rightX - 14},${eyeY - 8} Z`}
              fill="#F5D0C5"
            />
            {/* Highlights */}
            <Circle cx={leftX + 3} cy={eyeY + 1} r="2" fill="#FFF" />
            <Circle cx={rightX + 3} cy={eyeY + 1} r="2" fill="#FFF" />
          </G>
        );

      case 'surprised':
        // Wide open surprised eyes
        return (
          <G>
            {/* Big eye whites */}
            <Circle cx={leftX} cy={eyeY} r="16" fill="#FFF" />
            <Circle cx={rightX} cy={eyeY} r="16" fill="#FFF" />
            {/* Small pupils looking straight */}
            <Circle cx={leftX} cy={eyeY} r="8" fill={eyeColor} />
            <Circle cx={rightX} cy={eyeY} r="8" fill={eyeColor} />
            <Circle cx={leftX} cy={eyeY} r="5" fill="#1A1A1A" />
            <Circle cx={rightX} cy={eyeY} r="5" fill="#1A1A1A" />
            {/* Big highlights */}
            <Circle cx={leftX + 4} cy={eyeY - 4} r="4" fill="#FFF" />
            <Circle cx={rightX + 4} cy={eyeY - 4} r="4" fill="#FFF" />
            <Circle cx={leftX - 2} cy={eyeY + 3} r="2" fill="#FFF" opacity={0.6} />
            <Circle cx={rightX - 2} cy={eyeY + 3} r="2" fill="#FFF" opacity={0.6} />
          </G>
        );

      case 'wink':
        // One open, one winking
        return (
          <G>
            {/* Left eye - open */}
            <Circle cx={leftX} cy={eyeY} r="14" fill="#FFF" />
            <Circle cx={leftX} cy={eyeY + 1} r="9" fill={eyeColor} />
            <Circle cx={leftX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
            <Circle cx={leftX + 3} cy={eyeY - 2} r="3" fill="#FFF" />

            {/* Right eye - winking */}
            <Path
              d={`M${rightX - 12},${eyeY} Q${rightX},${eyeY - 6} ${rightX + 12},${eyeY}`}
              stroke="#1A1A1A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'cute':
        // Super big sparkly eyes
        return (
          <G>
            {/* Big round eye whites */}
            <Circle cx={leftX} cy={eyeY} r="16" fill="#FFF" />
            <Circle cx={rightX} cy={eyeY} r="16" fill="#FFF" />
            {/* Large colorful iris */}
            <Circle cx={leftX + 1} cy={eyeY + 2} r="12" fill={eyeColor} />
            <Circle cx={rightX + 1} cy={eyeY + 2} r="12" fill={eyeColor} />
            {/* Pupils */}
            <Circle cx={leftX + 2} cy={eyeY + 3} r="6" fill="#1A1A1A" />
            <Circle cx={rightX + 2} cy={eyeY + 3} r="6" fill="#1A1A1A" />
            {/* Multiple sparkles */}
            <Circle cx={leftX + 5} cy={eyeY - 4} r="5" fill="#FFF" />
            <Circle cx={rightX + 5} cy={eyeY - 4} r="5" fill="#FFF" />
            <Circle cx={leftX - 4} cy={eyeY + 5} r="2.5" fill="#FFF" opacity={0.8} />
            <Circle cx={rightX - 4} cy={eyeY + 5} r="2.5" fill="#FFF" opacity={0.8} />
          </G>
        );

      case 'normal':
      default:
        // Standard Duolingo-style eyes - big, friendly
        return (
          <G>
            {/* Eye whites - slightly oval */}
            <Ellipse cx={leftX} cy={eyeY} rx="14" ry="13" fill="#FFF" />
            <Ellipse cx={rightX} cy={eyeY} rx="14" ry="13" fill="#FFF" />
            {/* Colored iris */}
            <Circle cx={leftX} cy={eyeY + 1} r="9" fill={eyeColor} />
            <Circle cx={rightX} cy={eyeY + 1} r="9" fill={eyeColor} />
            {/* Dark pupil */}
            <Circle cx={leftX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
            <Circle cx={rightX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
            {/* Highlights - essential for the "alive" look */}
            <Circle cx={leftX + 3} cy={eyeY - 3} r="3.5" fill="#FFF" />
            <Circle cx={rightX + 3} cy={eyeY - 3} r="3.5" fill="#FFF" />
            <Circle cx={leftX - 1} cy={eyeY + 3} r="1.5" fill="#FFF" opacity={0.6} />
            <Circle cx={rightX - 1} cy={eyeY + 3} r="1.5" fill="#FFF" opacity={0.6} />
          </G>
        );
    }
  };

  return <G>{renderEyes()}</G>;
};

export default HumanEyes;

/**
 * Duolingo-Style Human Hair - Simple, iconic silhouettes
 */
import React from 'react';
import { G, Path, Ellipse, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export type HairStyle =
  | 'none'
  | 'short'
  | 'medium'
  | 'long'
  | 'curly'
  | 'spiky'
  | 'ponytail'
  | 'bun'
  | 'buzz'
  | 'afro'
  | 'wavy';

interface HumanHairProps {
  style?: HairStyle;
  color: string;
}

export const HumanHair: React.FC<HumanHairProps> = ({ style = 'short', color }) => {
  const darkerColor = adjustColor(color, -20);
  const lighterColor = adjustColor(color, 20);

  const renderHair = () => {
    switch (style) {
      case 'none':
        return null;

      case 'buzz':
        // Very short buzz cut - just a cap
        return (
          <G>
            <Path
              d="M52,75 Q52,35 100,32 Q148,35 148,75 Q145,55 100,52 Q55,55 52,75"
              fill={color}
            />
          </G>
        );

      case 'short':
        // Classic short hair - simple rounded top
        return (
          <G>
            <Defs>
              <LinearGradient id="shortGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lighterColor} />
                <Stop offset="100%" stopColor={color} />
              </LinearGradient>
            </Defs>
            <Path
              d="M50,78 Q48,45 70,32 Q90,22 100,22 Q110,22 130,32 Q152,45 150,78 Q148,55 130,42 Q110,32 100,32 Q90,32 70,42 Q52,55 50,78"
              fill="url(#shortGrad)"
            />
            {/* Side part line */}
            <Path
              d="M70,35 Q85,28 95,30"
              stroke={lighterColor}
              strokeWidth="2"
              fill="none"
              opacity={0.4}
            />
          </G>
        );

      case 'medium':
        // Medium length - covers ears slightly
        return (
          <G>
            <Defs>
              <LinearGradient id="medGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lighterColor} />
                <Stop offset="100%" stopColor={darkerColor} />
              </LinearGradient>
            </Defs>
            <Path
              d="M45,95 Q42,50 65,30 Q85,18 100,18 Q115,18 135,30 Q158,50 155,95 Q152,70 140,50 Q120,32 100,32 Q80,32 60,50 Q48,70 45,95"
              fill="url(#medGrad)"
            />
            {/* Side strands */}
            <Path
              d="M48,80 Q45,95 50,105"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M152,80 Q155,95 150,105"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'long':
        // Long flowing hair
        return (
          <G>
            <Defs>
              <LinearGradient id="longGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lighterColor} />
                <Stop offset="50%" stopColor={color} />
                <Stop offset="100%" stopColor={darkerColor} />
              </LinearGradient>
            </Defs>
            <Path
              d="M38,100 Q32,50 60,28 Q80,15 100,15 Q120,15 140,28 Q168,50 162,100 L162,165 Q160,180 145,180 L55,180 Q40,180 38,165 Z"
              fill="url(#longGrad)"
            />
            {/* Hair strand details */}
            <Path
              d="M55,110 Q52,140 58,170"
              stroke={darkerColor}
              strokeWidth="1.5"
              fill="none"
              opacity={0.3}
            />
            <Path
              d="M145,110 Q148,140 142,170"
              stroke={darkerColor}
              strokeWidth="1.5"
              fill="none"
              opacity={0.3}
            />
          </G>
        );

      case 'curly':
        // Curly hair - round puffy shapes
        return (
          <G>
            <Circle cx="65" cy="42" r="18" fill={color} />
            <Circle cx="90" cy="30" r="16" fill={lighterColor} />
            <Circle cx="110" cy="30" r="16" fill={color} />
            <Circle cx="135" cy="42" r="18" fill={lighterColor} />
            <Circle cx="100" cy="28" r="14" fill={darkerColor} />
            <Circle cx="52" cy="65" r="14" fill={color} />
            <Circle cx="148" cy="65" r="14" fill={color} />
            {/* Side curls */}
            <Circle cx="45" cy="88" r="10" fill={color} />
            <Circle cx="155" cy="88" r="10" fill={color} />
          </G>
        );

      case 'spiky':
        // Anime-style spiky hair
        return (
          <G>
            <Path
              d="M52,72 L58,22 L72,55 L82,12 L95,48 L100,5 L105,48 L118,12 L128,55 L142,22 L148,72 Q145,50 100,48 Q55,50 52,72"
              fill={color}
            />
            {/* Spike highlights */}
            <Path d="M82,18 L85,38" stroke={lighterColor} strokeWidth="2.5" strokeLinecap="round" />
            <Path
              d="M100,10 L100,32"
              stroke={lighterColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Path
              d="M118,18 L115,38"
              stroke={lighterColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </G>
        );

      case 'ponytail':
        // Short with ponytail on top
        return (
          <G>
            <Defs>
              <LinearGradient id="ponyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lighterColor} />
                <Stop offset="100%" stopColor={color} />
              </LinearGradient>
            </Defs>
            {/* Base hair */}
            <Path
              d="M50,75 Q48,48 70,35 Q90,25 100,25 Q110,25 130,35 Q152,48 150,75 Q148,58 130,48 Q110,38 100,38 Q90,38 70,48 Q52,58 50,75"
              fill="url(#ponyGrad)"
            />
            {/* Ponytail tie */}
            <Ellipse cx="100" cy="32" rx="10" ry="6" fill={darkerColor} />
            {/* Ponytail flowing up/back */}
            <Path d="M92,32 Q88,5 100,-8 Q112,5 108,32" fill={color} />
            <Ellipse cx="100" cy="-5" rx="10" ry="15" fill={color} />
          </G>
        );

      case 'bun':
        // Hair pulled back with a bun
        return (
          <G>
            {/* Slicked back base */}
            <Path
              d="M52,72 Q50,52 70,40 Q85,30 100,30 Q115,30 130,40 Q150,52 148,72 Q146,58 125,48 Q108,42 100,42 Q92,42 75,48 Q54,58 52,72"
              fill={color}
            />
            {/* Bun on top */}
            <Circle cx="100" cy="22" r="18" fill={color} />
            <Circle cx="100" cy="20" r="12" fill={darkerColor} opacity={0.5} />
            {/* Hair band */}
            <Ellipse cx="100" cy="36" rx="20" ry="4" fill={darkerColor} />
          </G>
        );

      case 'afro':
        // Big beautiful afro
        return (
          <G>
            <Ellipse cx="100" cy="55" rx="62" ry="52" fill={color} />
            {/* Texture highlights */}
            <Ellipse cx="72" cy="35" rx="14" ry="11" fill={lighterColor} opacity={0.4} />
            <Ellipse cx="128" cy="35" rx="14" ry="11" fill={lighterColor} opacity={0.4} />
            <Ellipse cx="100" cy="22" rx="16" ry="12" fill={lighterColor} opacity={0.3} />
          </G>
        );

      case 'wavy':
        // Medium-long wavy hair
        return (
          <G>
            <Defs>
              <LinearGradient id="wavyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lighterColor} />
                <Stop offset="100%" stopColor={darkerColor} />
              </LinearGradient>
            </Defs>
            <Path
              d="M42,95 Q38,50 60,30 Q80,18 100,18 Q120,18 140,30 Q162,50 158,95 Q158,115 152,130 Q148,140 142,128 Q138,110 142,90 Q145,70 135,50 Q120,32 100,32 Q80,32 65,50 Q55,70 58,90 Q62,110 58,128 Q52,140 48,130 Q42,115 42,95 Z"
              fill="url(#wavyGrad)"
            />
            {/* Wave definition lines */}
            <Path
              d="M52,85 Q58,100 52,118"
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              opacity={0.35}
            />
            <Path
              d="M148,85 Q142,100 148,118"
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              opacity={0.35}
            />
          </G>
        );

      default:
        return null;
    }
  };

  return <G>{renderHair()}</G>;
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default HumanHair;

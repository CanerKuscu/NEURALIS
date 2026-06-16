/**
 * League Badge Component - LoL/Duolingo Style Rank Badges
 * Each rank has unique visual design with gradients and effects
 */
import React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Circle,
  Ellipse,
  Polygon,
} from 'react-native-svg';

export type LeagueRank =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

interface LeagueBadgeProps {
  rank: LeagueRank;
  size?: number;
  style?: ViewStyle;
}

const RANK_COLORS: Record<
  LeagueRank,
  { primary: string; secondary: string; accent: string; glow: string }
> = {
  bronze: { primary: '#CD7F32', secondary: '#8B5A2B', accent: '#DDA15E', glow: '#CD7F32' },
  silver: { primary: '#C0C0C0', secondary: '#A8A8A8', accent: '#E8E8E8', glow: '#C0C0C0' },
  gold: { primary: '#FFD700', secondary: '#DAA520', accent: '#FFF8DC', glow: '#FFD700' },
  platinum: { primary: '#00CED1', secondary: '#008B8B', accent: '#7FFFD4', glow: '#00CED1' },
  diamond: { primary: '#B9F2FF', secondary: '#00BFFF', accent: '#E0FFFF', glow: '#00BFFF' },
  master: { primary: '#9932CC', secondary: '#6B238E', accent: '#DDA0DD', glow: '#9932CC' },
  grandmaster: { primary: '#FF4500', secondary: '#DC143C', accent: '#FF6347', glow: '#FF4500' },
  challenger: { primary: '#FFD700', secondary: '#FF69B4', accent: '#87CEEB', glow: '#FF1493' },
};

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({ rank, size = 80, style }) => {
  const colors = RANK_COLORS[rank];

  const renderBadge = () => {
    switch (rank) {
      case 'bronze':
        return (
          <G>
            <Defs>
              <LinearGradient id="bronzeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </LinearGradient>
            </Defs>
            {/* Shield shape */}
            <Path
              d="M50,10 L85,25 L85,55 Q85,80 50,95 Q15,80 15,55 L15,25 Z"
              fill="url(#bronzeGrad)"
              stroke={colors.secondary}
              strokeWidth="3"
            />
            {/* Inner design */}
            <Circle cx="50" cy="50" r="20" fill={colors.secondary} opacity={0.5} />
            <Path
              d="M50,35 L55,45 L65,47 L57,55 L60,65 L50,60 L40,65 L43,55 L35,47 L45,45 Z"
              fill={colors.accent}
            />
          </G>
        );

      case 'silver':
        return (
          <G>
            <Defs>
              <LinearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </LinearGradient>
            </Defs>
            <Path
              d="M50,8 L88,25 L88,58 Q88,82 50,97 Q12,82 12,58 L12,25 Z"
              fill="url(#silverGrad)"
              stroke="#888"
              strokeWidth="3"
            />
            <Circle cx="50" cy="48" r="22" fill="none" stroke={colors.accent} strokeWidth="3" />
            <Path
              d="M50,30 L56,42 L70,44 L60,54 L63,68 L50,61 L37,68 L40,54 L30,44 L44,42 Z"
              fill="#FFF"
              opacity={0.8}
            />
          </G>
        );

      case 'gold':
        return (
          <G>
            <Defs>
              <RadialGradient id="goldGrad" cx="50%" cy="30%" r="70%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </RadialGradient>
            </Defs>
            <Path
              d="M50,5 L92,22 L92,60 Q92,85 50,98 Q8,85 8,60 L8,22 Z"
              fill="url(#goldGrad)"
              stroke="#B8860B"
              strokeWidth="4"
            />
            {/* Crown on top */}
            <Path d="M35,20 L40,30 L50,22 L60,30 L65,20 L62,35 L38,35 Z" fill={colors.accent} />
            <Circle cx="50" cy="55" r="18" fill={colors.secondary} opacity={0.4} />
            <Path
              d="M50,40 L56,50 L67,52 L59,60 L61,72 L50,66 L39,72 L41,60 L33,52 L44,50 Z"
              fill="#FFF"
              opacity={0.9}
            />
          </G>
        );

      case 'platinum':
        return (
          <G>
            <Defs>
              <LinearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </LinearGradient>
            </Defs>
            <Path
              d="M50,5 L95,25 L95,60 Q95,88 50,98 Q5,88 5,60 L5,25 Z"
              fill="url(#platGrad)"
              stroke="#00868B"
              strokeWidth="4"
            />
            {/* Hexagon pattern */}
            <Polygon
              points="50,25 70,38 70,62 50,75 30,62 30,38"
              fill="none"
              stroke={colors.accent}
              strokeWidth="3"
            />
            <Circle cx="50" cy="50" r="15" fill={colors.accent} opacity={0.6} />
            <Path
              d="M50,38 L55,47 L65,48 L58,55 L60,65 L50,60 L40,65 L42,55 L35,48 L45,47 Z"
              fill="#FFF"
            />
          </G>
        );

      case 'diamond':
        return (
          <G>
            <Defs>
              <LinearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#E0FFFF" />
                <Stop offset="30%" stopColor={colors.primary} />
                <Stop offset="70%" stopColor={colors.secondary} />
                <Stop offset="100%" stopColor="#87CEEB" />
              </LinearGradient>
            </Defs>
            <Path
              d="M50,2 L98,22 L98,62 Q98,90 50,99 Q2,90 2,62 L2,22 Z"
              fill="url(#diamondGrad)"
              stroke={colors.secondary}
              strokeWidth="4"
            />
            {/* Diamond crystal */}
            <Polygon
              points="50,20 70,35 70,60 50,78 30,60 30,35"
              fill={colors.accent}
              stroke="#FFF"
              strokeWidth="2"
            />
            <Polygon points="50,20 60,32 50,45 40,32" fill="#FFF" opacity={0.7} />
            <Path
              d="M35,42 L50,55 L65,42"
              stroke="#FFF"
              strokeWidth="2"
              fill="none"
              opacity={0.5}
            />
          </G>
        );

      case 'master':
        return (
          <G>
            <Defs>
              <RadialGradient id="masterGrad" cx="50%" cy="50%" r="60%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </RadialGradient>
            </Defs>
            <Circle
              cx="50"
              cy="50"
              r="45"
              fill="url(#masterGrad)"
              stroke={colors.secondary}
              strokeWidth="5"
            />
            {/* Inner rings */}
            <Circle cx="50" cy="50" r="35" fill="none" stroke={colors.accent} strokeWidth="2" />
            <Circle cx="50" cy="50" r="25" fill={colors.secondary} opacity={0.5} />
            {/* Star */}
            <Path
              d="M50,25 L55,40 L72,42 L60,52 L64,70 L50,60 L36,70 L40,52 L28,42 L45,40 Z"
              fill={colors.accent}
              stroke="#FFF"
              strokeWidth="1"
            />
          </G>
        );

      case 'grandmaster':
        return (
          <G>
            <Defs>
              <RadialGradient id="gmGrad" cx="50%" cy="30%" r="70%">
                <Stop offset="0%" stopColor={colors.accent} />
                <Stop offset="50%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </RadialGradient>
            </Defs>
            {/* Flame-like badge */}
            <Path
              d="M50,5 Q20,30 15,50 Q10,75 30,90 Q45,98 50,98 Q55,98 70,90 Q90,75 85,50 Q80,30 50,5"
              fill="url(#gmGrad)"
              stroke="#8B0000"
              strokeWidth="4"
            />
            {/* Inner flame */}
            <Path
              d="M50,20 Q35,40 35,55 Q35,75 50,85 Q65,75 65,55 Q65,40 50,20"
              fill={colors.accent}
              opacity={0.7}
            />
            {/* Core */}
            <Ellipse cx="50" cy="60" rx="12" ry="15" fill="#FFF" opacity={0.4} />
            <Path
              d="M50,45 L54,55 L65,56 L57,63 L59,74 L50,68 L41,74 L43,63 L35,56 L46,55 Z"
              fill="#FFD700"
            />
          </G>
        );

      case 'challenger':
        return (
          <G>
            <Defs>
              <LinearGradient id="chalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFD700" />
                <Stop offset="25%" stopColor="#FF69B4" />
                <Stop offset="50%" stopColor="#87CEEB" />
                <Stop offset="75%" stopColor="#98FB98" />
                <Stop offset="100%" stopColor="#FFD700" />
              </LinearGradient>
              <RadialGradient id="chalGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#FFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Outer glow */}
            <Circle cx="50" cy="50" r="48" fill="url(#chalGlow)" />
            {/* Main badge */}
            <Circle cx="50" cy="50" r="42" fill="url(#chalGrad)" stroke="#FFD700" strokeWidth="4" />
            {/* Inner design */}
            <Circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="#FFF"
              strokeWidth="2"
              opacity={0.8}
            />
            <Circle cx="50" cy="50" r="22" fill="#FFF" opacity={0.3} />
            {/* Crown */}
            <Path
              d="M32,35 L38,48 L50,38 L62,48 L68,35 L65,52 L35,52 Z"
              fill="#FFD700"
              stroke="#FFF"
              strokeWidth="1"
            />
            {/* Star */}
            <Path
              d="M50,52 L54,62 L65,63 L57,70 L59,80 L50,74 L41,80 L43,70 L35,63 L46,62 Z"
              fill="#FFF"
            />
          </G>
        );
    }
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {renderBadge()}
      </Svg>
    </View>
  );
};

export const RANK_NAMES: Record<LeagueRank, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  master: 'Master',
  grandmaster: 'Grandmaster',
  challenger: 'Challenger',
};

export const RANK_ORDER: LeagueRank[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'grandmaster',
  'challenger',
];

export default LeagueBadge;

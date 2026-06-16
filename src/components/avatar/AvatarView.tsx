import React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, {
  G,
  Path,
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { AvatarConfig, HairType, EyeType, MouthType, ShirtType } from '../../types/avatar';
import { DEFAULT_AVATAR_CONFIG } from '../../types/avatar';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================================
// SVG COMPONENTS
// ============================================================================

// --- HEAD COMPONENT ---
const Head = ({ skinColor }: { skinColor: string }) => {
  const darker = adjustColor(skinColor, -15);
  const lighter = adjustColor(skinColor, 25);

  return (
    <G>
      <Defs>
        <RadialGradient id="skinGrad" cx="40%" cy="30%" r="60%">
          <Stop offset="0%" stopColor={lighter} />
          <Stop offset="100%" stopColor={skinColor} />
        </RadialGradient>
      </Defs>
      {/* Main head - smooth ellipse */}
      <Ellipse cx="100" cy="82" rx="48" ry="52" fill="url(#skinGrad)" />
      {/* Ears */}
      <Ellipse cx="52" cy="82" rx="7" ry="10" fill={skinColor} />
      <Ellipse cx="148" cy="82" rx="7" ry="10" fill={skinColor} />
      <Ellipse cx="52" cy="82" rx="4" ry="6" fill={darker} opacity={0.3} />
      <Ellipse cx="148" cy="82" rx="4" ry="6" fill={darker} opacity={0.3} />
    </G>
  );
};

// --- HAIR COMPONENT ---
const Hair = ({ type, color }: { type: HairType; color: string }) => {
  const darker = adjustColor(color, -20);
  const lighter = adjustColor(color, 20);

  const hairPaths: Record<HairType, React.ReactNode> = {
    none: null,
    short: (
      <G>
        <Defs>
          <LinearGradient id="hairGrad_short" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lighter} />
            <Stop offset="100%" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Path
          d="M50,78 Q48,45 70,32 Q90,22 100,22 Q110,22 130,32 Q152,45 150,78 Q148,55 130,42 Q110,32 100,32 Q90,32 70,42 Q52,55 50,78"
          fill="url(#hairGrad_short)"
        />
      </G>
    ),
    medium: (
      <G>
        <Defs>
          <LinearGradient id="hairGrad_med" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lighter} />
            <Stop offset="100%" stopColor={darker} />
          </LinearGradient>
        </Defs>
        <Path
          d="M45,95 Q42,50 65,30 Q85,18 100,18 Q115,18 135,30 Q158,50 155,95 Q152,70 140,50 Q120,32 100,32 Q80,32 60,50 Q48,70 45,95"
          fill="url(#hairGrad_med)"
        />
        <Path
          d="M48,80 Q45,95 50,108"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M152,80 Q155,95 150,108"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    ),
    long: (
      <G>
        <Defs>
          <LinearGradient id="hairGrad_long" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lighter} />
            <Stop offset="50%" stopColor={color} />
            <Stop offset="100%" stopColor={darker} />
          </LinearGradient>
        </Defs>
        <Path
          d="M38,100 Q32,50 60,28 Q80,15 100,15 Q120,15 140,28 Q168,50 162,100 L162,168 Q160,182 145,182 L55,182 Q40,182 38,168 Z"
          fill="url(#hairGrad_long)"
        />
      </G>
    ),
    curly: (
      <G>
        <Circle cx="65" cy="42" r="18" fill={color} />
        <Circle cx="90" cy="30" r="16" fill={lighter} />
        <Circle cx="110" cy="30" r="16" fill={color} />
        <Circle cx="135" cy="42" r="18" fill={lighter} />
        <Circle cx="100" cy="28" r="14" fill={darker} />
        <Circle cx="52" cy="65" r="14" fill={color} />
        <Circle cx="148" cy="65" r="14" fill={color} />
        <Circle cx="45" cy="88" r="11" fill={color} />
        <Circle cx="155" cy="88" r="11" fill={color} />
      </G>
    ),
    afro: (
      <G>
        <Ellipse cx="100" cy="55" rx="62" ry="52" fill={color} />
        <Ellipse cx="72" cy="35" rx="14" ry="11" fill={lighter} opacity={0.4} />
        <Ellipse cx="128" cy="35" rx="14" ry="11" fill={lighter} opacity={0.4} />
        <Ellipse cx="100" cy="22" rx="16" ry="12" fill={lighter} opacity={0.3} />
      </G>
    ),
    bun: (
      <G>
        <Path
          d="M52,72 Q50,52 70,40 Q85,30 100,30 Q115,30 130,40 Q150,52 148,72 Q146,58 125,48 Q108,42 100,42 Q92,42 75,48 Q54,58 52,72"
          fill={color}
        />
        <Circle cx="100" cy="22" r="18" fill={color} />
        <Circle cx="100" cy="20" r="12" fill={darker} opacity={0.5} />
        <Ellipse cx="100" cy="36" rx="20" ry="4" fill={darker} />
      </G>
    ),
    ponytail: (
      <G>
        <Defs>
          <LinearGradient id="hairGrad_pony" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lighter} />
            <Stop offset="100%" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Path
          d="M50,75 Q48,48 70,35 Q90,25 100,25 Q110,25 130,35 Q152,48 150,75 Q148,58 130,48 Q110,38 100,38 Q90,38 70,48 Q52,58 50,75"
          fill="url(#hairGrad_pony)"
        />
        <Ellipse cx="100" cy="32" rx="10" ry="6" fill={darker} />
        <Path d="M92,32 Q88,5 100,-8 Q112,5 108,32" fill={color} />
        <Ellipse cx="100" cy="-5" rx="10" ry="15" fill={color} />
      </G>
    ),
  };

  return <G>{hairPaths[type]}</G>;
};

// --- EYES COMPONENT ---
const Eyes = ({ type, color }: { type: EyeType; color: string }) => {
  const leftX = 78;
  const rightX = 122;
  const eyeY = 78;

  const eyeStyles: Record<EyeType, React.ReactNode> = {
    normal: (
      <G>
        <Ellipse cx={leftX} cy={eyeY} rx="14" ry="13" fill="#FFF" />
        <Ellipse cx={rightX} cy={eyeY} rx="14" ry="13" fill="#FFF" />
        <Circle cx={leftX} cy={eyeY + 1} r="9" fill={color} />
        <Circle cx={rightX} cy={eyeY + 1} r="9" fill={color} />
        <Circle cx={leftX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
        <Circle cx={rightX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
        <Circle cx={leftX + 3} cy={eyeY - 3} r="3.5" fill="#FFF" />
        <Circle cx={rightX + 3} cy={eyeY - 3} r="3.5" fill="#FFF" />
      </G>
    ),
    happy: (
      <G>
        <Path
          d={`M${leftX - 12},${eyeY} Q${leftX},${eyeY - 8} ${leftX + 12},${eyeY}`}
          stroke="#1A1A1A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M${rightX - 12},${eyeY} Q${rightX},${eyeY - 8} ${rightX + 12},${eyeY}`}
          stroke="#1A1A1A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    ),
    wink: (
      <G>
        <Circle cx={leftX} cy={eyeY} r="14" fill="#FFF" />
        <Circle cx={leftX} cy={eyeY + 1} r="9" fill={color} />
        <Circle cx={leftX} cy={eyeY + 1} r="5" fill="#1A1A1A" />
        <Circle cx={leftX + 3} cy={eyeY - 2} r="3" fill="#FFF" />
        <Path
          d={`M${rightX - 12},${eyeY} Q${rightX},${eyeY - 6} ${rightX + 12},${eyeY}`}
          stroke="#1A1A1A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    ),
    surprised: (
      <G>
        <Circle cx={leftX} cy={eyeY} r="16" fill="#FFF" />
        <Circle cx={rightX} cy={eyeY} r="16" fill="#FFF" />
        <Circle cx={leftX} cy={eyeY} r="8" fill={color} />
        <Circle cx={rightX} cy={eyeY} r="8" fill={color} />
        <Circle cx={leftX} cy={eyeY} r="5" fill="#1A1A1A" />
        <Circle cx={rightX} cy={eyeY} r="5" fill="#1A1A1A" />
        <Circle cx={leftX + 4} cy={eyeY - 4} r="4" fill="#FFF" />
        <Circle cx={rightX + 4} cy={eyeY - 4} r="4" fill="#FFF" />
      </G>
    ),
    sleepy: (
      <G>
        <Ellipse cx={leftX} cy={eyeY + 2} rx="13" ry="7" fill="#FFF" />
        <Ellipse cx={rightX} cy={eyeY + 2} rx="13" ry="7" fill="#FFF" />
        <Circle cx={leftX} cy={eyeY + 3} r="4" fill="#1A1A1A" />
        <Circle cx={rightX} cy={eyeY + 3} r="4" fill="#1A1A1A" />
      </G>
    ),
  };

  return <G>{eyeStyles[type]}</G>;
};

// --- EYEBROWS COMPONENT ---
const Eyebrows = ({ hairColor }: { hairColor: string }) => {
  const leftX = 78;
  const rightX = 122;
  const browY = 58;

  return (
    <G>
      <Path
        d={`M${leftX - 12},${browY + 1} Q${leftX},${browY - 3} ${leftX + 12},${browY + 1}`}
        stroke={hairColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${rightX - 12},${browY + 1} Q${rightX},${browY - 3} ${rightX + 12},${browY + 1}`}
        stroke={hairColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
};

// --- NOSE COMPONENT ---
const Nose = ({ skinColor }: { skinColor: string }) => {
  const darker = adjustColor(skinColor, -25);
  return (
    <G>
      <Path
        d="M96,94 Q100,89 104,94"
        stroke={darker}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
    </G>
  );
};

// --- MOUTH COMPONENT ---
const Mouth = ({ type }: { type: MouthType }) => {
  const mouthY = 108;
  const mouthX = 100;

  const mouthStyles: Record<MouthType, React.ReactNode> = {
    smile: (
      <Path
        d={`M${mouthX - 15},${mouthY} Q${mouthX},${mouthY + 12} ${mouthX + 15},${mouthY}`}
        stroke="#E57373"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    ),
    grin: (
      <G>
        <Path
          d={`M${mouthX - 18},${mouthY} Q${mouthX},${mouthY + 18} ${mouthX + 18},${mouthY}`}
          fill="#1A1A1A"
        />
        <Path
          d={`M${mouthX - 15},${mouthY} L${mouthX + 15},${mouthY} L${mouthX + 12},${mouthY + 6} L${mouthX - 12},${mouthY + 6} Z`}
          fill="#FFF"
        />
      </G>
    ),
    neutral: (
      <Path
        d={`M${mouthX - 12},${mouthY} L${mouthX + 12},${mouthY}`}
        stroke="#E57373"
        strokeWidth="3"
        strokeLinecap="round"
      />
    ),
    open: (
      <G>
        <Ellipse cx={mouthX} cy={mouthY + 5} rx="12" ry="10" fill="#1A1A1A" />
        <Ellipse cx={mouthX} cy={mouthY + 10} rx="8" ry="5" fill="#E57373" />
      </G>
    ),
    smirk: (
      <Path
        d={`M${mouthX - 10},${mouthY + 2} Q${mouthX},${mouthY} ${mouthX + 12},${mouthY - 5}`}
        stroke="#E57373"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    ),
  };

  return <G>{mouthStyles[type]}</G>;
};

// --- SHIRT/BODY COMPONENT ---
const Shirt = ({
  type,
  color,
  skinColor,
}: {
  type: ShirtType;
  color: string;
  skinColor: string;
}) => {
  const darker = adjustColor(color, -25);
  const lighter = adjustColor(color, 20);

  return (
    <G>
      <Defs>
        <LinearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={darker} />
        </LinearGradient>
      </Defs>

      {/* Base body shape - More rounded shoulders */}
      <Path
        d="M60,133 Q45,133 45,160 L42,200 L158,200 L155,160 Q155,133 140,133 Z"
        fill="url(#shirtGrad)"
      />

      {/* Style specific details */}
      {type === 'hoodie' && (
        <G>
          <Path
            d="M65,133 Q100,128 135,133"
            stroke={darker}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M70,172 Q100,178 130,172 L128,192 Q100,198 72,192 Z"
            fill={darker}
            opacity={0.3}
          />
          <Path d="M88,140 L88,156" stroke={lighter} strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M112,140 L112,156" stroke={lighter} strokeWidth="2.5" strokeLinecap="round" />
        </G>
      )}

      {type === 'sweater' && (
        <G>
          <Ellipse cx="100" cy="135" rx="20" ry="8" fill={darker} />
          <Path d="M55,155 L145,155" stroke={darker} strokeWidth="1" opacity={0.25} />
          <Path d="M52,170 L148,170" stroke={darker} strokeWidth="1" opacity={0.25} />
          <Path d="M48,185 L152,185" stroke={darker} strokeWidth="1" opacity={0.25} />
        </G>
      )}

      {type === 'tank' && (
        <G>
          <Ellipse cx="100" cy="136" rx="25" ry="10" fill={skinColor} />
          <Path
            d="M60,138 Q50,153 50,173"
            stroke={skinColor}
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M140,138 Q150,153 150,173"
            stroke={skinColor}
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      )}

      {/* Neck for t-shirt */}
      {type === 'tshirt' && (
        <G>
          <Ellipse cx="100" cy="133" rx="15" ry="7" fill={skinColor} />
          <Ellipse cx="100" cy="135" rx="18" ry="5" fill={darker} opacity={0.5} />
        </G>
      )}
    </G>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AvatarViewProps {
  config?: AvatarConfig;
  size?: number;
  style?: ViewStyle;
  showBackground?: boolean;
}

export const AvatarView = React.memo(
  ({
    config = DEFAULT_AVATAR_CONFIG,
    size = 150,
    style,
    showBackground = true,
  }: AvatarViewProps) => {
    // If config comes from potentially untyped/old source, default it safely
    const safeConfig = { ...DEFAULT_AVATAR_CONFIG, ...config };

    const {
      skinColor,
      hairType,
      hairColor,
      eyeType,
      eyeColor,
      mouthType,
      shirtType,
      shirtColor,
      bgColor,
    } = safeConfig;

    const hairBehind = ['long', 'afro'].includes(hairType);
    const darkerBg = adjustColor(bgColor, -20);

    return (
      <View style={[{ width: size, height: size }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="bgGradient_main" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={bgColor} />
              <Stop offset="100%" stopColor={darkerBg} />
            </LinearGradient>
          </Defs>

          {/* Background - Optional */}
          {showBackground && <Circle cx="100" cy="100" r="95" fill="url(#bgGradient_main)" />}

          {/* Hair behind (for long/afro styles) */}
          {hairBehind && <Hair type={hairType} color={hairColor} />}

          {/* Body/Shirt */}
          <Shirt type={shirtType} color={shirtColor} skinColor={skinColor} />

          {/* Head */}
          <Head skinColor={skinColor} />

          {/* Hair in front */}
          {!hairBehind && hairType !== 'none' && <Hair type={hairType} color={hairColor} />}

          {/* Eyebrows */}
          <Eyebrows hairColor={hairColor} />

          {/* Eyes */}
          <Eyes type={eyeType} color={eyeColor} />

          {/* Nose */}
          <Nose skinColor={skinColor} />

          {/* Mouth */}
          <Mouth type={mouthType} />
        </Svg>
      </View>
    );
  },
);

export default AvatarView;

/**
 * Duolingo-Style Human Body - Simple, clean, minimalist
 */
import React from 'react';
import { G, Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

export type BodyStyle = 'tshirt' | 'hoodie' | 'shirt' | 'tank' | 'sweater';

interface HumanBodyProps {
    style?: BodyStyle;
    color: string;
    skinColor: string;
}

export const HumanBody: React.FC<HumanBodyProps> = ({ style = 'tshirt', color, skinColor }) => {
    const darkerColor = adjustColor(color, -25);
    const lighterColor = adjustColor(color, 20);

    // All body styles share the same simple silhouette - Duolingo keeps it minimal
    const bodyBase = "M55,140 Q55,135 65,135 L135,135 Q145,135 145,140 L155,200 L45,200 Z";
    const neckY = 135;

    return (
        <G>
            <Defs>
                <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={color} />
                    <Stop offset="100%" stopColor={darkerColor} />
                </LinearGradient>
            </Defs>

            {/* Body/Shirt base - simple rounded shape */}
            <Path d={bodyBase} fill="url(#bodyGradient)" />

            {/* Style-specific details */}
            {style === 'hoodie' && (
                <G>
                    {/* Hood shadow at neck */}
                    <Path
                        d="M65,135 Q100,130 135,135"
                        stroke={darkerColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Kangaroo pocket - subtle */}
                    <Path
                        d="M70,175 Q100,180 130,175 L128,195 Q100,200 72,195 Z"
                        fill={darkerColor}
                        opacity={0.3}
                    />
                    {/* Drawstrings */}
                    <Path d="M88,142 L88,158" stroke={lighterColor} strokeWidth="2.5" strokeLinecap="round" />
                    <Path d="M112,142 L112,158" stroke={lighterColor} strokeWidth="2.5" strokeLinecap="round" />
                </G>
            )}

            {style === 'shirt' && (
                <G>
                    {/* Collar - v-neck style */}
                    <Path
                        d="M82,135 L100,152 L118,135"
                        fill={lighterColor}
                    />
                    {/* Collar outline */}
                    <Path
                        d="M78,135 L100,155 L122,135"
                        stroke={darkerColor}
                        strokeWidth="1.5"
                        fill="none"
                    />
                    {/* Buttons */}
                    <Ellipse cx="100" cy="165" rx="2.5" ry="2.5" fill={darkerColor} />
                    <Ellipse cx="100" cy="180" rx="2.5" ry="2.5" fill={darkerColor} />
                </G>
            )}

            {style === 'tank' && (
                <G>
                    {/* Wide neck opening */}
                    <Ellipse cx="100" cy="138" rx="25" ry="10" fill={skinColor} />
                    {/* Arm holes visible */}
                    <Path
                        d="M60,140 Q50,155 50,175"
                        stroke={skinColor}
                        strokeWidth="18"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <Path
                        d="M140,140 Q150,155 150,175"
                        stroke={skinColor}
                        strokeWidth="18"
                        strokeLinecap="round"
                        fill="none"
                    />
                </G>
            )}

            {style === 'sweater' && (
                <G>
                    {/* Ribbed collar */}
                    <Ellipse cx="100" cy="137" rx="20" ry="8" fill={darkerColor} />
                    {/* Subtle texture lines */}
                    <Path d="M55,155 L145,155" stroke={darkerColor} strokeWidth="1" opacity={0.25} />
                    <Path d="M52,170 L148,170" stroke={darkerColor} strokeWidth="1" opacity={0.25} />
                    <Path d="M48,185 L152,185" stroke={darkerColor} strokeWidth="1" opacity={0.25} />
                </G>
            )}

            {/* Neck - shown for t-shirt and sweater */}
            {(style === 'tshirt' || style === 'sweater') && (
                <Ellipse cx="100" cy={neckY} rx="15" ry="7" fill={skinColor} />
            )}

            {/* T-shirt collar ring */}
            {style === 'tshirt' && (
                <Ellipse cx="100" cy={neckY + 2} rx="18" ry="5" fill={darkerColor} opacity={0.5} />
            )}
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

export default HumanBody;

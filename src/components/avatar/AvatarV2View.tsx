/**
 * AvatarV2View — Instagram-quality SVG avatar renderer
 * Supports full customization: face shapes, detailed features, accessories, outfits
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    Rect,
    Circle,
    Ellipse,
    Path,
    G,
    ClipPath,
    Line,
} from 'react-native-svg';
import { AvatarV2Config, DEFAULT_AVATAR_V2 } from '../../types/avatar-v2';

interface Props {
    config?: Partial<AvatarV2Config>;
    size?: number;
    showBg?: boolean;
}

// Utility: darken/lighten color
function adjustColor(hex: string, amount: number): string {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function AvatarV2View({ config: partial, size = 200, showBg = true }: Props) {
    const c: AvatarV2Config = useMemo(() => ({ ...DEFAULT_AVATAR_V2, ...partial }), [partial]);

    const vb = 200;
    const scale = size / vb;
    const skinDark = adjustColor(c.skinTone, -25);
    const skinLight = adjustColor(c.skinTone, 20);
    const naturalLip = adjustColor(c.skinTone, -35);
    const lipFill = c.lipColor === 'natural' ? naturalLip : c.lipColor;

    // Face path by shape
    const facePath = useMemo(() => {
        switch (c.faceShape) {
            case 'round':
                return 'M100,45 C135,45 155,70 155,105 C155,145 135,165 100,165 C65,165 45,145 45,105 C45,70 65,45 100,45 Z';
            case 'square':
                return 'M100,45 C140,45 155,55 155,80 L155,130 C155,155 140,165 100,165 C60,165 45,155 45,130 L45,80 C45,55 60,45 100,45 Z';
            case 'heart':
                return 'M100,45 C140,45 158,65 158,95 C158,130 140,155 100,170 C60,155 42,130 42,95 C42,65 60,45 100,45 Z';
            case 'oblong':
                return 'M100,38 C132,38 150,58 150,88 L150,120 C150,155 132,172 100,172 C68,172 50,155 50,120 L50,88 C50,58 68,38 100,38 Z';
            case 'diamond':
                return 'M100,42 C130,42 152,70 152,105 C152,135 130,160 100,168 C70,160 48,135 48,105 C48,70 70,42 100,42 Z';
            default: // oval
                return 'M100,42 C138,42 155,68 155,105 C155,142 135,168 100,168 C65,168 45,142 45,105 C45,68 62,42 100,42 Z';
        }
    }, [c.faceShape]);

    // Ear positions
    const earX = c.faceShape === 'square' ? 42 : c.faceShape === 'round' ? 43 : 44;
    const earXr = c.faceShape === 'square' ? 158 : c.faceShape === 'round' ? 157 : 156;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
                <Defs>
                    {/* Skin gradient for depth */}
                    <RadialGradient id="skinGrad" cx="50%" cy="40%" rx="50%" ry="50%">
                        <Stop offset="0%" stopColor={skinLight} />
                        <Stop offset="100%" stopColor={c.skinTone} />
                    </RadialGradient>
                    {/* BG gradient */}
                    <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={c.bgColor} />
                        <Stop offset="100%" stopColor={c.bgSecondaryColor} />
                    </LinearGradient>
                    {/* Face clip */}
                    <ClipPath id="faceClip">
                        <Path d={facePath} />
                    </ClipPath>
                    {/* Hair gradient */}
                    <LinearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={adjustColor(c.hairColor, 20)} />
                        <Stop offset="100%" stopColor={c.hairColor} />
                    </LinearGradient>
                </Defs>

                {/* ═══ BACKGROUND ═══ */}
                {showBg && (
                    <G>
                        {c.bgStyle === 'gradient' ? (
                            <Rect x="0" y="0" width={vb} height={vb} rx="30" fill="url(#bgGrad)" />
                        ) : c.bgStyle === 'pattern' ? (
                            <G>
                                <Rect x="0" y="0" width={vb} height={vb} rx="30" fill={c.bgColor} />
                                {/* Dot pattern */}
                                {Array.from({ length: 8 }).map((_, i) =>
                                    Array.from({ length: 8 }).map((_, j) => (
                                        <Circle
                                            key={`p${i}${j}`}
                                            cx={12 + j * 25}
                                            cy={12 + i * 25}
                                            r="2"
                                            fill={c.bgSecondaryColor}
                                            opacity={0.3}
                                        />
                                    ))
                                )}
                            </G>
                        ) : (
                            <Rect x="0" y="0" width={vb} height={vb} rx="30" fill={c.bgColor} />
                        )}
                    </G>
                )}

                {/* ═══ NECK ═══ */}
                <Rect x="82" y="150" width="36" height="30" rx="8" fill={c.skinTone} />
                <Rect x="84" y="150" width="32" height="20" rx="6" fill={skinLight} opacity={0.3} />

                {/* ═══ OUTFIT ═══ */}
                <RenderOutfit top={c.outfitTop} color={c.outfitColor} />

                {/* ═══ NECKLACE ═══ */}
                {c.necklace !== 'none' && <RenderNecklace style={c.necklace} />}

                {/* ═══ EARS ═══ */}
                <Ellipse cx={earX} cy="105" rx="8" ry="12" fill={c.skinTone} />
                <Ellipse cx={earXr} cy="105" rx="8" ry="12" fill={c.skinTone} />
                <Ellipse cx={earX + 2} cy="105" rx="4" ry="7" fill={skinDark} opacity={0.15} />
                <Ellipse cx={earXr - 2} cy="105" rx="4" ry="7" fill={skinDark} opacity={0.15} />

                {/* ═══ EARRINGS ═══ */}
                {c.earrings !== 'none' && <RenderEarrings style={c.earrings} lx={earX} rx={earXr} />}

                {/* ═══ FACE ═══ */}
                <Path d={facePath} fill="url(#skinGrad)" />
                {/* Jaw shadow */}
                <Path d={facePath} fill={skinDark} opacity={0.08} clipPath="url(#faceClip)" />

                {/* ═══ CHEEKS ═══ */}
                <RenderCheeks style={c.cheeks} skinTone={c.skinTone} />

                {/* ═══ BEAUTY MARK ═══ */}
                <RenderBeautyMark position={c.beautyMark} />

                {/* ═══ EYES ═══ */}
                <G>
                    <RenderEye x={75} y={98} shape={c.eyeShape} color={c.eyeColor} eyelashes={c.eyelashes} mirrored={false} />
                    <RenderEye x={125} y={98} shape={c.eyeShape} color={c.eyeColor} eyelashes={c.eyelashes} mirrored={true} />
                </G>

                {/* ═══ EYEBROWS ═══ */}
                <RenderEyebrows shape={c.eyebrowShape} color={c.eyebrowColor} />

                {/* ═══ NOSE ═══ */}
                <RenderNose type={c.noseType} skinDark={skinDark} />

                {/* ═══ MOUTH ═══ */}
                <RenderMouth shape={c.lipShape} color={lipFill} expression={c.expression} />

                {/* ═══ FACIAL HAIR ═══ */}
                {c.facialHair !== 'none' && (
                    <RenderFacialHair type={c.facialHair} color={c.facialHairColor} />
                )}

                {/* ═══ PIERCINGS ═══ */}
                {c.piercing !== 'none' && <RenderPiercing style={c.piercing} />}

                {/* ═══ HAIR (back layer handled, front layer here) ═══ */}
                <RenderHair style={c.hairStyle} color={c.hairColor} faceShape={c.faceShape} />

                {/* ═══ GLASSES ═══ */}
                {c.glassesStyle !== 'none' && (
                    <RenderGlasses style={c.glassesStyle} color={c.glassesColor} />
                )}

                {/* ═══ HEADWEAR ═══ */}
                {c.headwear !== 'none' && (
                    <RenderHeadwear type={c.headwear} color={c.headwearColor} />
                )}
            </Svg>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function RenderEye({ x, y, shape, color, eyelashes, mirrored }: { x: number; y: number; shape: string; color: string; eyelashes: string; mirrored: boolean }) {
    let rx = 11, ry = 7;
    let pupilR = 4.5, irisR = 6;

    switch (shape) {
        case 'almond': rx = 12; ry = 5.5; break;
        case 'round': rx = 9; ry = 9; break;
        case 'narrow': rx = 12; ry = 4; pupilR = 3.5; irisR = 4.5; break;
        case 'wide': rx = 13; ry = 8; break;
        case 'hooded': rx = 11; ry = 6; break;
        case 'monolid': rx = 12; ry = 5; break;
        case 'downturned': rx = 11; ry = 6.5; break;
        case 'upturned': rx = 11; ry = 6.5; break;
    }

    const eyelashLen = eyelashes === 'dramatic' ? 5 : eyelashes === 'long' ? 3.5 : eyelashes === 'natural' ? 2 : 0;

    return (
        <G>
            {/* Eye white */}
            <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#FFFFFF" />
            {/* Iris */}
            <Circle cx={x} cy={y + 0.5} r={irisR} fill={color} />
            {/* Pupil */}
            <Circle cx={x} cy={y + 0.5} r={pupilR} fill="#1A1A1A" />
            {/* Highlight */}
            <Circle cx={x + 2} cy={y - 1.5} r="1.8" fill="#FFFFFF" opacity={0.9} />
            <Circle cx={x - 1.5} cy={y + 1} r="0.8" fill="#FFFFFF" opacity={0.5} />
            {/* Eye outline (upper lid) */}
            <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke="#2C2C2C" strokeWidth="1.2" />
            {/* Upper lid shadow (hooded effect) */}
            {(shape === 'hooded' || shape === 'monolid') && (
                <Path
                    d={`M${x - rx},${y} Q${x},${y - ry - 2} ${x + rx},${y}`}
                    fill="none"
                    stroke="#2C2C2C"
                    strokeWidth="1"
                    opacity={0.3}
                />
            )}
            {/* Eyelashes */}
            {eyelashLen > 0 && (
                <G>
                    <Line x1={x - rx + 2} y1={y - ry + 1} x2={x - rx} y2={y - ry - eyelashLen} stroke="#1A1A1A" strokeWidth="1" />
                    <Line x1={x - rx / 2} y1={y - ry} x2={x - rx / 2 - 1} y2={y - ry - eyelashLen - 1} stroke="#1A1A1A" strokeWidth="1" />
                    <Line x1={x} y1={y - ry} x2={x} y2={y - ry - eyelashLen - 1.5} stroke="#1A1A1A" strokeWidth="1" />
                    <Line x1={x + rx / 2} y1={y - ry} x2={x + rx / 2 + 1} y2={y - ry - eyelashLen - 1} stroke="#1A1A1A" strokeWidth="1" />
                    <Line x1={x + rx - 2} y1={y - ry + 1} x2={x + rx} y2={y - ry - eyelashLen} stroke="#1A1A1A" strokeWidth="1" />
                </G>
            )}
        </G>
    );
}

function RenderEyebrows({ shape, color }: { shape: string; color: string }) {
    let sw = 2.5;
    let lPath = 'M60,83 Q75,78 90,83';
    let rPath = 'M110,83 Q125,78 140,83';

    switch (shape) {
        case 'arched':
            lPath = 'M60,85 Q75,74 90,83'; rPath = 'M110,83 Q125,74 140,85'; break;
        case 'straight':
            lPath = 'M60,82 L90,82'; rPath = 'M110,82 L140,82'; sw = 2.8; break;
        case 'thick':
            sw = 4; break;
        case 'thin':
            sw = 1.5; break;
        case 'curved':
            lPath = 'M60,85 Q75,76 90,82'; rPath = 'M110,82 Q125,76 140,85'; break;
        case 'angeled':
            lPath = 'M60,86 L75,79 L90,82'; rPath = 'M110,82 L125,79 L140,86'; break;
        case 'bushy':
            sw = 4.5;
            lPath = 'M58,84 Q75,76 92,84'; rPath = 'M108,84 Q125,76 142,84'; break;
    }

    return (
        <G>
            <Path d={lPath} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d={rPath} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
        </G>
    );
}

function RenderNose({ type, skinDark }: { type: string; skinDark: string }) {
    switch (type) {
        case 'small':
            return <Path d="M97,112 Q100,117 103,112" stroke={skinDark} strokeWidth="1.5" fill="none" />;
        case 'wide':
            return (
                <G>
                    <Path d="M95,106 L93,118 Q100,122 107,118 L105,106" stroke={skinDark} strokeWidth="1.2" fill="none" />
                    <Circle cx="94" cy="118" r="2.5" fill={skinDark} opacity={0.15} />
                    <Circle cx="106" cy="118" r="2.5" fill={skinDark} opacity={0.15} />
                </G>
            );
        case 'pointed':
            return <Path d="M100,100 L96,120 L104,120 Z" stroke={skinDark} strokeWidth="1" fill="none" />;
        case 'button':
            return (
                <G>
                    <Circle cx="100" cy="116" r="4" fill={skinDark} opacity={0.1} />
                    <Path d="M97,116 Q100,119 103,116" stroke={skinDark} strokeWidth="1.3" fill="none" />
                </G>
            );
        case 'aquiline':
            return <Path d="M100,98 L102,108 L100,118 Q96,120 100,118" stroke={skinDark} strokeWidth="1.5" fill="none" />;
        case 'snub':
            return <Path d="M98,106 Q100,112 100,114 Q102,116 104,114" stroke={skinDark} strokeWidth="1.3" fill="none" />;
        case 'greek':
            return (
                <G>
                    <Path d="M100,92 L100,116" stroke={skinDark} strokeWidth="1.3" fill="none" />
                    <Path d="M96,118 Q100,121 104,118" stroke={skinDark} strokeWidth="1.3" fill="none" />
                </G>
            );
        default:
            return (
                <G>
                    <Path d="M100,104 L97,118 Q100,120 103,118 Z" stroke={skinDark} strokeWidth="1" fill="none" />
                    <Path d="M97,118 Q100,120 103,118" stroke={skinDark} strokeWidth="1.2" fill="none" />
                </G>
            );
    }
}

function RenderMouth({ shape, color, expression }: { shape: string; color: string; expression: string }) {
    let mouthPath: string;
    let fill = color;
    let showTeeth = false;

    // Combine shape and expression
    switch (expression) {
        case 'smile':
            mouthPath = 'M84,136 Q100,150 116,136';
            break;
        case 'grin':
            mouthPath = 'M82,134 Q100,156 118,134 Z';
            showTeeth = true;
            break;
        case 'slight-smile':
            mouthPath = 'M87,138 Q100,146 113,138';
            break;
        case 'open-mouth':
            mouthPath = 'M85,135 Q100,155 115,135 Q100,148 85,135 Z';
            showTeeth = true;
            break;
        case 'smirk':
            mouthPath = 'M87,140 Q100,142 115,136';
            break;
        case 'pout':
            mouthPath = 'M88,140 Q100,135 112,140 Q100,146 88,140 Z';
            break;
        case 'laugh':
            mouthPath = 'M80,134 Q100,160 120,134 Z';
            showTeeth = true;
            break;
        default: // neutral
            mouthPath = 'M87,140 Q100,142 113,140';
            break;
    }

    // Adjust for lip shape
    let lipWidth = 1.8;
    switch (shape) {
        case 'thin': lipWidth = 1.2; break;
        case 'full': lipWidth = 2.8; break;
        case 'cupid': lipWidth = 2; break;
        case 'wide': lipWidth = 2; break;
    }

    return (
        <G>
            {showTeeth && (
                <Path d={mouthPath} fill="#FFFFFF" />
            )}
            <Path
                d={mouthPath}
                stroke={fill}
                strokeWidth={lipWidth}
                fill={showTeeth ? 'none' : fill}
                opacity={showTeeth ? 1 : (expression === 'neutral' || expression === 'slight-smile' || expression === 'smirk') ? 1 : 0.85}
                strokeLinecap="round"
            />
            {/* Lip highlight */}
            {(shape === 'full' || shape === 'cupid') && (
                <Ellipse cx="100" cy="137" rx="6" ry="1.5" fill="#FFFFFF" opacity={0.15} />
            )}
        </G>
    );
}

function RenderHair({ style, color, faceShape }: { style: string; color: string; faceShape: string }) {
    if (style === 'none') return null;
    const dark = adjustColor(color, -30);
    const light = adjustColor(color, 25);

    const hairPaths: Record<string, React.ReactNode> = {
        'buzz': (
            <G>
                <Path d="M52,85 Q52,42 100,40 Q148,42 148,85 L148,70 Q148,42 100,38 Q52,42 52,70 Z" fill={color} />
            </G>
        ),
        'crew': (
            <G>
                <Path d="M50,90 Q48,42 100,38 Q152,42 150,90 L148,75 Q148,44 100,40 Q52,44 52,75 Z" fill={color} />
                <Path d="M55,75 Q55,45 100,42 Q145,45 145,75" fill={dark} opacity={0.3} />
            </G>
        ),
        'short-classic': (
            <G>
                <Path d="M48,95 Q46,42 100,36 Q154,42 152,95 L150,80 Q150,44 100,38 Q50,44 50,80 Z" fill={color} />
                <Path d="M55,82 Q52,48 100,42 Q148,48 145,82" fill={dark} opacity={0.2} />
                {/* Side part line */}
                <Path d="M72,40 Q75,55 80,70" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
            </G>
        ),
        'short-textured': (
            <G>
                <Path d="M48,95 Q44,38 100,34 Q156,38 152,95 L150,78 Q152,40 100,36 Q48,40 50,78 Z" fill={color} />
                {/* Texture lines */}
                <Path d="M65,42 Q68,52 64,60" stroke={light} strokeWidth="1.5" fill="none" opacity={0.4} />
                <Path d="M85,38 Q88,48 84,58" stroke={light} strokeWidth="1.5" fill="none" opacity={0.4} />
                <Path d="M110,38 Q113,48 109,58" stroke={light} strokeWidth="1.5" fill="none" opacity={0.4} />
                <Path d="M130,42 Q133,52 129,60" stroke={light} strokeWidth="1.5" fill="none" opacity={0.4} />
            </G>
        ),
        'side-part': (
            <G>
                <Path d="M46,95 Q44,40 100,34 Q156,40 154,95 L150,78 Q152,42 100,36 Q48,42 50,78 Z" fill={color} />
                <Path d="M70,36 L70,65" stroke={dark} strokeWidth="1.5" fill="none" opacity={0.4} />
                <Path d="M50,70 Q55,45 70,38 Q50,48 50,70" fill={dark} opacity={0.2} />
            </G>
        ),
        'medium-wavy': (
            <G>
                <Path d="M42,105 Q38,38 100,30 Q162,38 158,105 C155,85 152,40 100,34 C48,40 45,85 42,105 Z" fill={color} />
                {/* Wave texture */}
                <Path d="M48,75 Q55,65 48,55 Q55,45 60,42" stroke={light} strokeWidth="2" fill="none" opacity={0.3} />
                <Path d="M152,75 Q145,65 152,55 Q145,45 140,42" stroke={light} strokeWidth="2" fill="none" opacity={0.3} />
                {/* Side hair */}
                <Path d="M42,105 Q38,115 42,130 Q44,115 48,105" fill={color} />
                <Path d="M158,105 Q162,115 158,130 Q156,115 152,105" fill={color} />
            </G>
        ),
        'medium-straight': (
            <G>
                <Path d="M42,110 Q38,38 100,30 Q162,38 158,110 L155,80 Q155,40 100,34 Q45,40 45,80 Z" fill={color} />
                <Path d="M42,110 L42,125 Q44,115 48,108" fill={color} />
                <Path d="M158,110 L158,125 Q156,115 152,108" fill={color} />
            </G>
        ),
        'medium-curly': (
            <G>
                <Path d="M40,110 Q35,35 100,28 Q165,35 160,110 C158,80 155,38 100,32 C45,38 42,80 40,110 Z" fill={color} />
                {/* Curl texture */}
                <Path d="M45,75 C42,65 50,55 45,48" stroke={light} strokeWidth="2.5" fill="none" opacity={0.3} />
                <Path d="M155,75 C158,65 150,55 155,48" stroke={light} strokeWidth="2.5" fill="none" opacity={0.3} />
                <Path d="M40,110 C35,120 40,135 44,128" fill={color} />
                <Path d="M160,110 C165,120 160,135 156,128" fill={color} />
                {/* Extra curls at sides */}
                <Circle cx="40" cy="118" r="6" fill={color} />
                <Circle cx="160" cy="118" r="6" fill={color} />
            </G>
        ),
        'long-straight': (
            <G>
                <Path d="M40,160 Q35,35 100,26 Q165,35 160,160 L158,80 Q160,38 100,30 Q40,38 42,80 Z" fill={color} />
                <Path d="M40,160 Q42,170 48,172" fill={color} />
                <Path d="M160,160 Q158,170 152,172" fill={color} />
                {/* Strands */}
                <Line x1="55" y1="50" x2="45" y2="155" stroke={dark} strokeWidth="0.5" opacity={0.2} />
                <Line x1="145" y1="50" x2="155" y2="155" stroke={dark} strokeWidth="0.5" opacity={0.2} />
            </G>
        ),
        'long-wavy': (
            <G>
                <Path d="M38,160 Q32,32 100,24 Q168,32 162,160 C160,80 158,36 100,28 C42,36 40,80 38,160 Z" fill={color} />
                <Path d="M38,160 C35,168 40,175 46,170" fill={color} />
                <Path d="M162,160 C165,168 160,175 154,170" fill={color} />
                {/* Wave texture */}
                <Path d="M42,90 Q50,80 42,70 Q50,60 44,50" stroke={light} strokeWidth="2" fill="none" opacity={0.3} />
                <Path d="M158,90 Q150,80 158,70 Q150,60 156,50" stroke={light} strokeWidth="2" fill="none" opacity={0.3} />
            </G>
        ),
        'long-curly': (
            <G>
                <Path d="M36,158 Q28,28 100,22 Q172,28 164,158 C162,80 160,32 100,26 C40,32 38,80 36,158 Z" fill={color} />
                {/* Big curls */}
                <Circle cx="36" cy="130" r="8" fill={color} />
                <Circle cx="164" cy="130" r="8" fill={color} />
                <Circle cx="38" cy="110" r="7" fill={color} />
                <Circle cx="162" cy="110" r="7" fill={color} />
                <Circle cx="40" cy="148" r="7" fill={color} />
                <Circle cx="160" cy="148" r="7" fill={color} />
            </G>
        ),
        'afro': (
            <G>
                <Circle cx="100" cy="85" r="65" fill={color} />
                <Circle cx="100" cy="85" r="62" fill={dark} opacity={0.15} />
                {/* Texture */}
                <Circle cx="60" cy="55" r="3" fill={light} opacity={0.2} />
                <Circle cx="140" cy="55" r="3" fill={light} opacity={0.2} />
                <Circle cx="100" cy="30" r="3" fill={light} opacity={0.2} />
                <Circle cx="45" cy="85" r="3" fill={light} opacity={0.2} />
                <Circle cx="155" cy="85" r="3" fill={light} opacity={0.2} />
            </G>
        ),
        'bun-high': (
            <G>
                <Path d="M48,92 Q46,42 100,36 Q154,42 152,92 L150,75 Q150,44 100,38 Q50,44 50,75 Z" fill={color} />
                <Circle cx="100" cy="28" r="18" fill={color} />
                <Circle cx="100" cy="28" r="15" fill={dark} opacity={0.15} />
            </G>
        ),
        'bun-low': (
            <G>
                <Path d="M48,92 Q46,42 100,36 Q154,42 152,92 L150,75 Q150,44 100,38 Q50,44 50,75 Z" fill={color} />
                <Circle cx="100" cy="165" r="16" fill={color} />
            </G>
        ),
        'bun-messy': (
            <G>
                <Path d="M48,95 Q44,40 100,34 Q156,40 152,95 L150,78 Q152,42 100,36 Q48,42 50,78 Z" fill={color} />
                <Circle cx="100" cy="26" r="20" fill={color} />
                <Circle cx="92" cy="18" r="6" fill={light} opacity={0.3} />
                <Circle cx="110" cy="20" r="5" fill={light} opacity={0.3} />
                <Path d="M85,14 Q80,8 82,15" stroke={color} strokeWidth="3" fill="none" />
                <Path d="M118,16 Q122,8 120,18" stroke={color} strokeWidth="3" fill="none" />
            </G>
        ),
        'ponytail': (
            <G>
                <Path d="M48,92 Q46,42 100,36 Q154,42 152,92 L150,75 Q150,44 100,38 Q50,44 50,75 Z" fill={color} />
                <Path d="M90,50 Q95,55 100,58 Q105,55 110,50 L115,60 Q110,100 100,130 Q90,100 85,60 Z" fill={color} />
            </G>
        ),
        'ponytail-high': (
            <G>
                <Path d="M48,92 Q46,42 100,36 Q154,42 152,92 L150,75 Q150,44 100,38 Q50,44 50,75 Z" fill={color} />
                <Circle cx="105" cy="35" r="10" fill={color} />
                <Path d="M105,45 Q115,70 110,110 Q108,85 100,65" fill={color} />
            </G>
        ),
        'ponytail-side': (
            <G>
                <Path d="M48,92 Q46,42 100,36 Q154,42 152,92 L150,75 Q150,44 100,38 Q50,44 50,75 Z" fill={color} />
                <Path d="M148,80 Q155,95 152,130 Q148,110 145,95" fill={color} />
            </G>
        ),
        'pixie': (
            <G>
                <Path d="M48,88 Q46,42 100,36 Q154,42 152,88 L150,72 Q150,44 100,38 Q50,44 50,72 Z" fill={color} />
                {/* Wispy side */}
                <Path d="M48,88 Q42,92 45,98" fill={color} />
                <Path d="M152,88 Q158,90 155,95" fill={color} />
                {/* Top texture */}
                <Path d="M70,40 Q85,32 100,36" stroke={light} strokeWidth="2" fill="none" opacity={0.3} />
            </G>
        ),
        'bob': (
            <G>
                <Path d="M44,120 Q40,38 100,32 Q160,38 156,120 L154,78 Q155,42 100,35 Q45,42 46,78 Z" fill={color} />
                {/* Bob ends curve inward */}
                <Path d="M44,120 Q48,128 56,125" fill={color} />
                <Path d="M156,120 Q152,128 144,125" fill={color} />
            </G>
        ),
        'lob': (
            <G>
                <Path d="M42,140 Q38,36 100,30 Q162,36 158,140 L155,78 Q158,40 100,33 Q42,40 45,78 Z" fill={color} />
                <Path d="M42,140 Q46,148 52,145" fill={color} />
                <Path d="M158,140 Q154,148 148,145" fill={color} />
            </G>
        ),
        'mohawk': (
            <G>
                <Path d="M80,85 Q78,20 100,12 Q122,20 120,85 L118,55 Q118,22 100,16 Q82,22 82,55 Z" fill={color} />
                {/* Fade sides */}
                <Path d="M52,85 Q52,60 65,50 L65,55 Q55,64 55,85" fill={color} opacity={0.3} />
                <Path d="M148,85 Q148,60 135,50 L135,55 Q145,64 145,85" fill={color} opacity={0.3} />
            </G>
        ),
        'undercut': (
            <G>
                <Path d="M50,85 Q48,42 100,36 Q152,42 150,85 L148,72 Q148,44 100,38 Q52,44 52,72 Z" fill={color} />
                {/* Longer top swept */}
                <Path d="M55,70 Q65,38 120,36 Q140,38 145,55" fill={color} />
                {/* Shaved sides visible */}
                <Path d="M50,85 Q50,80 52,72" stroke={adjustColor(color, 40)} strokeWidth="1" fill="none" opacity={0.4} />
                <Path d="M150,85 Q150,80 148,72" stroke={adjustColor(color, 40)} strokeWidth="1" fill="none" opacity={0.4} />
            </G>
        ),
        'fade': (
            <G>
                <Path d="M50,90 Q48,42 100,36 Q152,42 150,90 L148,70 Q148,44 100,38 Q52,44 52,70 Z" fill={color} />
                {/* Fade gradient effect */}
                <Path d="M52,90 Q52,82 54,75" fill={adjustColor(color, 50)} opacity={0.3} />
                <Path d="M148,90 Q148,82 146,75" fill={adjustColor(color, 50)} opacity={0.3} />
            </G>
        ),
        'afro-puff': (
            <G>
                <Path d="M48,90 Q46,42 100,36 Q154,42 152,90 L150,72 Q150,44 100,38 Q50,44 50,72 Z" fill={color} />
                {/* Two puffs */}
                <Circle cx="72" cy="30" r="18" fill={color} />
                <Circle cx="128" cy="30" r="18" fill={color} />
            </G>
        ),
        'braids': (
            <G>
                <Path d="M46,90 Q44,42 100,36 Q156,42 154,90 L152,72 Q152,44 100,38 Q48,44 48,72 Z" fill={color} />
                {/* Left braid */}
                <Path d="M50,90 Q46,105 48,120 Q46,135 50,150 Q48,160 52,170" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
                {/* Right braid */}
                <Path d="M150,90 Q154,105 152,120 Q154,135 150,150 Q152,160 148,170" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
                {/* Braid texture */}
                <Path d="M48,100 L52,100" stroke={dark} strokeWidth="1" opacity={0.3} />
                <Path d="M46,115 L50,115" stroke={dark} strokeWidth="1" opacity={0.3} />
                <Path d="M48,130 L52,130" stroke={dark} strokeWidth="1" opacity={0.3} />
                <Path d="M148,100 L152,100" stroke={dark} strokeWidth="1" opacity={0.3} />
                <Path d="M150,115 L154,115" stroke={dark} strokeWidth="1" opacity={0.3} />
                <Path d="M148,130 L152,130" stroke={dark} strokeWidth="1" opacity={0.3} />
            </G>
        ),
        'cornrows': (
            <G>
                <Path d="M50,90 Q48,42 100,36 Q152,42 150,90 L148,72 Q148,44 100,38 Q52,44 52,72 Z" fill={color} />
                {/* Cornrow lines */}
                <Path d="M65,40 L65,85" stroke={dark} strokeWidth="1.5" opacity={0.4} />
                <Path d="M80,38 L80,85" stroke={dark} strokeWidth="1.5" opacity={0.4} />
                <Path d="M100,36 L100,85" stroke={dark} strokeWidth="1.5" opacity={0.4} />
                <Path d="M120,38 L120,85" stroke={dark} strokeWidth="1.5" opacity={0.4} />
                <Path d="M135,40 L135,85" stroke={dark} strokeWidth="1.5" opacity={0.4} />
            </G>
        ),
        'dreadlocks': (
            <G>
                <Path d="M38,100 Q32,30 100,22 Q168,30 162,100 C160,65 158,34 100,26 C42,34 40,65 38,100 Z" fill={color} />
                {/* Dread strands */}
                <Path d="M42,100 Q38,130 45,160" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
                <Path d="M52,95 Q48,125 50,155" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
                <Path d="M158,100 Q162,130 155,160" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
                <Path d="M148,95 Q152,125 150,155" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
                <Path d="M65,50 Q58,80 55,100" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" />
                <Path d="M135,50 Q142,80 145,100" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </G>
        ),
    };

    return hairPaths[style] || hairPaths['short-classic'] || null;
}

function RenderFacialHair({ type, color }: { type: string; color: string }) {
    const dark = adjustColor(color, -20);

    switch (type) {
        case 'stubble':
            // Deterministic positions for stubble dots
            const stubblePositions = [
                [84, 130], [92, 133], [100, 131], [108, 134], [116, 130],
                [86, 138], [94, 140], [102, 137], [110, 141], [114, 136],
                [88, 146], [96, 148], [104, 145], [112, 149], [118, 143],
                [90, 154], [98, 156], [106, 153], [114, 157], [82, 142],
            ];
            return (
                <G opacity={0.4}>
                    {stubblePositions.map(([cx, cy], i) => (
                        <Circle key={`s${i}`} cx={cx} cy={cy} r="0.6" fill={color} />
                    ))}
                </G>
            );
        case 'mustache':
            return <Path d="M85,128 Q90,134 100,132 Q110,134 115,128" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />;
        case 'goatee':
            return (
                <G>
                    <Path d="M90,145 Q100,160 110,145" fill={color} />
                    <Path d="M92,140 Q100,150 108,140" fill={dark} opacity={0.2} />
                </G>
            );
        case 'full-beard':
            return (
                <G>
                    <Path d="M55,120 Q55,160 100,172 Q145,160 145,120" fill={color} />
                    <Path d="M55,120 Q55,160 100,172 Q145,160 145,120" fill={dark} opacity={0.1} />
                    <Path d="M85,128 Q90,134 100,132 Q110,134 115,128" stroke={dark} strokeWidth="2" fill="none" opacity={0.3} />
                </G>
            );
        case 'short-beard':
            return (
                <G>
                    <Path d="M60,125 Q60,155 100,165 Q140,155 140,125" fill={color} />
                    <Path d="M85,128 Q90,134 100,132 Q110,134 115,128" stroke={dark} strokeWidth="2" fill="none" opacity={0.3} />
                </G>
            );
        case 'chinstrap':
            return <Path d="M55,115 Q55,155 100,162 Q145,155 145,115" stroke={color} strokeWidth="4" fill="none" />;
        case 'soul-patch':
            return <Ellipse cx="100" cy="148" rx="4" ry="6" fill={color} />;
        case 'handlebar':
            return (
                <G>
                    <Path d="M85,130 Q78,128 72,124" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
                    <Path d="M115,130 Q122,128 128,124" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
                    <Path d="M85,130 Q100,136 115,130" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </G>
            );
        case 'van-dyke':
            return (
                <G>
                    <Path d="M85,128 Q90,134 100,132 Q110,134 115,128" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <Path d="M90,145 Q100,165 110,145" fill={color} />
                </G>
            );
        default:
            return null;
    }
}

function RenderGlasses({ style, color }: { style: string; color: string }) {
    const isSunglasses = style.startsWith('sunglasses');
    const lensFill = isSunglasses ? color : 'none';
    const lensOpacity = isSunglasses ? 0.7 : 1;

    switch (style) {
        case 'round':
        case 'sunglasses-round':
            return (
                <G opacity={lensOpacity}>
                    <Circle cx="75" cy="98" r="16" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Circle cx="125" cy="98" r="16" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Line x1="91" y1="98" x2="109" y2="98" stroke={color} strokeWidth="2" />
                    <Line x1="59" y1="95" x2="48" y2="92" stroke={color} strokeWidth="1.5" />
                    <Line x1="141" y1="95" x2="152" y2="92" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'square':
            return (
                <G>
                    <Rect x="60" y="86" width="30" height="24" rx="3" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Rect x="110" y="86" width="30" height="24" rx="3" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Line x1="90" y1="98" x2="110" y2="98" stroke={color} strokeWidth="2" />
                    <Line x1="60" y1="95" x2="48" y2="92" stroke={color} strokeWidth="1.5" />
                    <Line x1="140" y1="95" x2="152" y2="92" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'aviator':
        case 'sunglasses-aviator':
            return (
                <G opacity={lensOpacity}>
                    <Path d="M58,90 Q58,84 75,84 Q92,84 92,90 L92,105 Q92,112 75,112 Q58,112 58,105 Z" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Path d="M108,90 Q108,84 125,84 Q142,84 142,90 L142,105 Q142,112 125,112 Q108,112 108,105 Z" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Line x1="92" y1="94" x2="108" y2="94" stroke={color} strokeWidth="2" />
                    <Line x1="58" y1="92" x2="46" y2="90" stroke={color} strokeWidth="1.5" />
                    <Line x1="142" y1="92" x2="154" y2="90" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'cat-eye':
            return (
                <G>
                    <Path d="M58,100 Q58,86 75,86 Q92,86 92,94 L92,102 Q92,110 75,110 Q58,110 58,102 Z" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Path d="M108,100 Q108,86 125,86 Q142,86 142,94 L142,102 Q142,110 125,110 Q108,110 108,102 Z" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Path d="M58,88 L52,82" stroke={color} strokeWidth="2" />
                    <Path d="M142,88 L148,82" stroke={color} strokeWidth="2" />
                    <Line x1="92" y1="96" x2="108" y2="96" stroke={color} strokeWidth="2" />
                </G>
            );
        case 'wayfarer':
            return (
                <G>
                    <Rect x="58" y="86" width="34" height="24" rx="4" fill={lensFill} stroke={color} strokeWidth="2.5" />
                    <Rect x="108" y="86" width="34" height="24" rx="4" fill={lensFill} stroke={color} strokeWidth="2.5" />
                    <Line x1="92" y1="96" x2="108" y2="96" stroke={color} strokeWidth="2.5" />
                    <Line x1="58" y1="94" x2="46" y2="91" stroke={color} strokeWidth="2" />
                    <Line x1="142" y1="94" x2="154" y2="91" stroke={color} strokeWidth="2" />
                </G>
            );
        case 'rectangular':
            return (
                <G>
                    <Rect x="60" y="88" width="30" height="20" rx="2" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Rect x="110" y="88" width="30" height="20" rx="2" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Line x1="90" y1="98" x2="110" y2="98" stroke={color} strokeWidth="2" />
                    <Line x1="60" y1="95" x2="48" y2="92" stroke={color} strokeWidth="1.5" />
                    <Line x1="140" y1="95" x2="152" y2="92" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'rimless':
            return (
                <G>
                    <Ellipse cx="75" cy="98" rx="15" ry="10" fill="none" stroke={color} strokeWidth="0.8" />
                    <Ellipse cx="125" cy="98" rx="15" ry="10" fill="none" stroke={color} strokeWidth="0.8" />
                    <Line x1="90" y1="98" x2="110" y2="98" stroke={color} strokeWidth="1" />
                    <Line x1="60" y1="96" x2="48" y2="93" stroke={color} strokeWidth="1" />
                    <Line x1="140" y1="96" x2="152" y2="93" stroke={color} strokeWidth="1" />
                </G>
            );
        case 'oversized':
            return (
                <G>
                    <Ellipse cx="75" cy="98" rx="22" ry="18" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Ellipse cx="125" cy="98" rx="22" ry="18" fill={lensFill} stroke={color} strokeWidth="2" />
                    <Line x1="97" y1="96" x2="103" y2="96" stroke={color} strokeWidth="2" />
                    <Line x1="53" y1="93" x2="44" y2="90" stroke={color} strokeWidth="1.5" />
                    <Line x1="147" y1="93" x2="156" y2="90" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'sunglasses-sport':
            return (
                <G opacity={0.8}>
                    <Path d="M48,96 Q48,84 75,84 Q100,84 100,92 L100,102 Q100,110 75,110 Q48,110 48,102 Z" fill={color} stroke={color} strokeWidth="1.5" />
                    <Path d="M100,96 Q100,84 125,84 Q152,84 152,92 L152,102 Q152,110 125,110 Q100,110 100,102 Z" fill={color} stroke={color} strokeWidth="1.5" />
                    <Ellipse cx="100" cy="96" rx="3" ry="8" fill={adjustColor(color, 20)} />
                </G>
            );
        default:
            return (
                <G>
                    <Circle cx="75" cy="98" r="14" fill="none" stroke={color} strokeWidth="2" />
                    <Circle cx="125" cy="98" r="14" fill="none" stroke={color} strokeWidth="2" />
                    <Line x1="89" y1="98" x2="111" y2="98" stroke={color} strokeWidth="2" />
                </G>
            );
    }
}

function RenderHeadwear({ type, color }: { type: string; color: string }) {
    const dark = adjustColor(color, -30);

    switch (type) {
        case 'cap':
            return (
                <G>
                    <Path d="M45,72 Q45,30 100,26 Q155,30 155,72 L155,68 Q155,32 100,28 Q45,32 45,68 Z" fill={color} />
                    <Rect x="42" y="68" width="116" height="8" rx="4" fill={dark} />
                    {/* Brim */}
                    <Path d="M42,72 Q38,78 60,82 L42,76 Z" fill={dark} />
                    <Path d="M158,72 Q162,78 140,82 L158,76 Z" fill={dark} />
                    {/* Button on top */}
                    <Circle cx="100" cy="30" r="3" fill={dark} />
                </G>
            );
        case 'beanie':
            return (
                <G>
                    <Path d="M46,80 Q44,28 100,20 Q156,28 154,80 L154,72 Q154,30 100,24 Q46,30 46,72 Z" fill={color} />
                    {/* Fold line */}
                    <Path d="M48,72 Q100,65 152,72" stroke={dark} strokeWidth="2" fill="none" opacity={0.3} />
                    {/* Ribbing */}
                    <Path d="M50,76 Q100,70 150,76" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                    {/* Pom-pom */}
                    <Circle cx="100" cy="18" r="8" fill={dark} />
                </G>
            );
        case 'fedora':
            return (
                <G>
                    <Path d="M50,72 Q48,38 100,32 Q152,38 150,72 Z" fill={color} />
                    {/* Brim */}
                    <Ellipse cx="100" cy="72" rx="60" ry="10" fill={color} />
                    <Ellipse cx="100" cy="72" rx="58" ry="8" fill={dark} opacity={0.2} />
                    {/* Band */}
                    <Path d="M55,65 Q100,60 145,65" stroke={dark} strokeWidth="3" fill="none" />
                </G>
            );
        case 'bucket-hat':
            return (
                <G>
                    <Path d="M50,75 Q48,40 100,34 Q152,40 150,75 Z" fill={color} />
                    {/* Wide brim */}
                    <Ellipse cx="100" cy="75" rx="62" ry="12" fill={color} />
                    <Ellipse cx="100" cy="75" rx="60" ry="10" fill={dark} opacity={0.15} />
                </G>
            );
        case 'bandana':
            return (
                <G>
                    <Path d="M50,68 Q50,52 100,48 Q150,52 150,68 L148,62 Q148,54 100,50 Q52,54 52,62 Z" fill={color} />
                    {/* Knot at back */}
                    <Path d="M145,62 L155,50 L160,60" fill={color} />
                    <Path d="M55,62 L45,50 L40,60" fill={color} />
                </G>
            );
        case 'turban':
            return (
                <G>
                    <Path d="M46,78 Q42,24 100,16 Q158,24 154,78 Z" fill={color} />
                    {/* Wrap folds */}
                    <Path d="M55,50 Q100,35 145,50" stroke={dark} strokeWidth="1.5" fill="none" opacity={0.3} />
                    <Path d="M52,60 Q100,48 148,60" stroke={dark} strokeWidth="1.5" fill="none" opacity={0.3} />
                    <Path d="M50,70 Q100,60 150,70" stroke={dark} strokeWidth="1.5" fill="none" opacity={0.3} />
                    {/* Center jewel */}
                    <Circle cx="100" cy="52" r="4" fill={dark} />
                    <Circle cx="100" cy="52" r="2" fill="#FFD700" />
                </G>
            );
        case 'headband':
            return (
                <G>
                    <Path d="M48,72 Q48,66 100,62 Q152,66 152,72 L150,68 Q150,64 100,60 Q50,64 50,68 Z" fill={color} />
                </G>
            );
        case 'crown':
            return (
                <G>
                    <Path d="M55,65 L60,32 L80,52 L100,28 L120,52 L140,32 L145,65 Z" fill="#FFD700" />
                    <Path d="M55,65 L60,32 L80,52 L100,28 L120,52 L140,32 L145,65 Z" fill="none" stroke="#DAA520" strokeWidth="1.5" />
                    {/* Jewels */}
                    <Circle cx="100" cy="50" r="3" fill="#E74C3C" />
                    <Circle cx="76" cy="56" r="2.5" fill="#3498DB" />
                    <Circle cx="124" cy="56" r="2.5" fill="#2ECC71" />
                    {/* Base band */}
                    <Rect x="55" y="62" width="90" height="6" rx="2" fill="#DAA520" />
                </G>
            );
        case 'beret':
            return (
                <G>
                    <Ellipse cx="90" cy="55" rx="48" ry="22" fill={color} />
                    <Path d="M48,68 Q48,64 90,60 Q140,64 140,68" fill={color} />
                    {/* Stem */}
                    <Circle cx="90" cy="38" r="3" fill={dark} />
                </G>
            );
        case 'hijab':
            return (
                <G>
                    <Path d="M42,170 Q38,55 100,30 Q162,55 158,170 L156,80 Q158,45 100,34 Q42,45 44,80 Z" fill={color} />
                    {/* Inner edge */}
                    <Path d="M52,78 Q52,50 100,40 Q148,50 148,78" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                    {/* Drape */}
                    <Path d="M42,120 Q40,145 44,165" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                    <Path d="M158,120 Q160,145 156,165" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                </G>
            );
        default:
            return null;
    }
}

function RenderOutfit({ top, color }: { top: string; color: string }) {
    const dark = adjustColor(color, -30);
    const light = adjustColor(color, 30);

    switch (top) {
        case 'hoodie':
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q140,168 120,167 L100,165 L80,167 Q60,168 55,170 Z" fill={color} />
                    {/* Hood */}
                    <Path d="M60,165 Q58,158 65,155 Q80,150 100,150 Q120,150 135,155 Q142,158 140,165" fill={color} />
                    <Path d="M60,165 Q58,158 65,155 Q80,150 100,150 Q120,150 135,155 Q142,158 140,165" fill={dark} opacity={0.15} />
                    {/* Drawstrings */}
                    <Line x1="92" y1="168" x2="90" y2="182" stroke={light} strokeWidth="1" />
                    <Line x1="108" y1="168" x2="110" y2="182" stroke={light} strokeWidth="1" />
                    {/* Center line */}
                    <Line x1="100" y1="168" x2="100" y2="200" stroke={dark} strokeWidth="1" opacity={0.2} />
                </G>
            );
        case 'sweater':
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q135,168 118,166 L100,165 L82,166 Q65,168 55,170 Z" fill={color} />
                    {/* Collar */}
                    <Path d="M75,165 Q100,158 125,165" stroke={dark} strokeWidth="3" fill="none" />
                    {/* Ribbing lines */}
                    <Path d="M40,192 L160,192" stroke={dark} strokeWidth="1" opacity={0.15} />
                    <Path d="M38,196 L162,196" stroke={dark} strokeWidth="1" opacity={0.15} />
                </G>
            );
        case 'jacket':
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q135,168 118,166 L100,165 L82,166 Q65,168 55,170 Z" fill={color} />
                    {/* Lapels */}
                    <Path d="M80,166 L92,180 L88,200" fill={dark} opacity={0.3} />
                    <Path d="M120,166 L108,180 L112,200" fill={dark} opacity={0.3} />
                    {/* Center line */}
                    <Line x1="100" y1="168" x2="100" y2="200" stroke={dark} strokeWidth="1.5" />
                    {/* Buttons */}
                    <Circle cx="100" cy="178" r="2" fill={dark} />
                    <Circle cx="100" cy="190" r="2" fill={dark} />
                </G>
            );
        case 'tank':
            return (
                <G>
                    <Path d="M68,168 Q55,172 45,200 L155,200 Q145,172 132,168 L120,166 L100,165 L80,166 Z" fill={color} />
                    {/* Straps */}
                    <Rect x="78" y="160" width="10" height="10" rx="3" fill={color} />
                    <Rect x="112" y="160" width="10" height="10" rx="3" fill={color} />
                </G>
            );
        case 'shirt-collar':
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q135,168 118,166 L100,165 L82,166 Q65,168 55,170 Z" fill={color} />
                    {/* Collar */}
                    <Path d="M80,165 L88,155 L100,162 L112,155 L120,165" fill="#FFFFFF" stroke={dark} strokeWidth="0.8" />
                    {/* Center line */}
                    <Line x1="100" y1="162" x2="100" y2="200" stroke={dark} strokeWidth="0.8" opacity={0.3} />
                    {/* Buttons */}
                    <Circle cx="100" cy="172" r="1.5" fill={dark} opacity={0.4} />
                    <Circle cx="100" cy="182" r="1.5" fill={dark} opacity={0.4} />
                    <Circle cx="100" cy="192" r="1.5" fill={dark} opacity={0.4} />
                </G>
            );
        case 'turtleneck':
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q135,168 118,166 L100,165 L82,166 Q65,168 55,170 Z" fill={color} />
                    {/* Turtle neck */}
                    <Rect x="78" y="152" width="44" height="16" rx="8" fill={color} />
                    <Path d="M80,158 Q100,155 120,158" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                    <Path d="M80,162 Q100,159 120,162" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                </G>
            );
        case 'crop-top':
            return (
                <G>
                    <Path d="M60,168 Q50,172 45,195 L155,195 Q150,172 140,168 Q130,166 118,165 L100,164 L82,165 Q70,166 60,168 Z" fill={color} />
                    <Path d="M82,164 Q100,158 118,164" stroke={color} strokeWidth="3" fill="none" />
                </G>
            );
        case 'blazer':
            return (
                <G>
                    <Path d="M50,170 Q35,172 25,200 L175,200 Q165,172 150,170 Q140,168 120,166 L100,165 L80,166 Q60,168 50,170 Z" fill={color} />
                    {/* Lapels */}
                    <Path d="M78,166 L90,182 L82,200" fill={dark} opacity={0.25} />
                    <Path d="M122,166 L110,182 L118,200" fill={dark} opacity={0.25} />
                    {/* Inner shirt */}
                    <Path d="M90,170 L100,166 L110,170 L100,200 Z" fill="#FFFFFF" opacity={0.8} />
                    {/* Button */}
                    <Circle cx="100" cy="185" r="2" fill={dark} />
                </G>
            );
        case 'vest':
            return (
                <G>
                    <Path d="M65,168 Q55,172 48,200 L152,200 Q145,172 135,168 Q125,166 118,165 L100,164 L82,165 Q75,166 65,168 Z" fill={color} />
                    {/* Armholes */}
                    <Path d="M65,168 Q60,175 58,185" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                    <Path d="M135,168 Q140,175 142,185" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                    {/* V neck */}
                    <Path d="M82,165 L100,178 L118,165" stroke={dark} strokeWidth="1" fill="none" opacity={0.3} />
                </G>
            );
        case 'dress':
            return (
                <G>
                    <Path d="M60,168 Q45,172 30,200 L170,200 Q155,172 140,168 Q130,166 118,165 L100,164 L82,165 Q70,166 60,168 Z" fill={color} />
                    {/* Neckline */}
                    <Path d="M80,164 Q100,170 120,164" fill={dark} opacity={0.15} />
                    {/* Waist cinch */}
                    <Path d="M55,185 Q100,180 145,185" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                </G>
            );
        case 'overalls':
            return (
                <G>
                    {/* Inner shirt */}
                    <Path d="M60,168 Q50,172 42,200 L158,200 Q150,172 140,168 L118,165 L100,164 L82,165 Z" fill="#FFFFFF" />
                    {/* Overall body */}
                    <Path d="M65,180 Q55,182 45,200 L155,200 Q145,182 135,180 L120,178 L100,177 L80,178 Z" fill={color} />
                    {/* Straps */}
                    <Rect x="78" y="160" width="8" height="22" rx="3" fill={color} />
                    <Rect x="114" y="160" width="8" height="22" rx="3" fill={color} />
                    {/* Buttons */}
                    <Circle cx="82" cy="181" r="2" fill={dark} />
                    <Circle cx="118" cy="181" r="2" fill={dark} />
                    {/* Pocket */}
                    <Rect x="90" y="186" width="20" height="12" rx="2" fill="none" stroke={dark} strokeWidth="1" opacity={0.3} />
                </G>
            );
        default: // tshirt
            return (
                <G>
                    <Path d="M55,170 Q40,172 30,200 L170,200 Q160,172 145,170 Q135,168 118,166 L100,165 L82,166 Q65,168 55,170 Z" fill={color} />
                    {/* Collar */}
                    <Path d="M80,165 Q100,160 120,165" stroke={dark} strokeWidth="1.5" fill="none" />
                    {/* Sleeve hints */}
                    <Path d="M55,172 Q48,175 42,180" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                    <Path d="M145,172 Q152,175 158,180" stroke={dark} strokeWidth="1" fill="none" opacity={0.2} />
                </G>
            );
    }
}

function RenderCheeks({ style, skinTone }: { style: string; skinTone: string }) {
    if (style === 'none') return null;

    return (
        <G>
            {(style === 'blush' || style === 'blush-freckles') && (
                <G>
                    <Ellipse cx="65" cy="120" rx="10" ry="5" fill="#FF6B6B" opacity={0.15} />
                    <Ellipse cx="135" cy="120" rx="10" ry="5" fill="#FF6B6B" opacity={0.15} />
                </G>
            )}
            {(style === 'freckles' || style === 'blush-freckles') && (
                <G>
                    {[62, 67, 72, 65, 70].map((x, i) => (
                        <Circle key={`fl${i}`} cx={x} cy={118 + (i % 2) * 5} r="1" fill={adjustColor(skinTone, -60)} opacity={0.35} />
                    ))}
                    {[128, 133, 138, 131, 136].map((x, i) => (
                        <Circle key={`fr${i}`} cx={x} cy={118 + (i % 2) * 5} r="1" fill={adjustColor(skinTone, -60)} opacity={0.35} />
                    ))}
                </G>
            )}
            {style === 'dimples' && (
                <G>
                    <Circle cx="72" cy="132" r="2.5" fill={adjustColor(skinTone, -20)} opacity={0.25} />
                    <Circle cx="128" cy="132" r="2.5" fill={adjustColor(skinTone, -20)} opacity={0.25} />
                </G>
            )}
        </G>
    );
}

function RenderBeautyMark({ position }: { position: string }) {
    if (position === 'none') return null;
    const positions: Record<string, { cx: number; cy: number }> = {
        'left-cheek': { cx: 65, cy: 125 },
        'right-cheek': { cx: 135, cy: 125 },
        'chin': { cx: 100, cy: 155 },
        'upper-lip': { cx: 108, cy: 132 },
    };
    const p = positions[position];
    if (!p) return null;
    return <Circle cx={p.cx} cy={p.cy} r="1.8" fill="#3B2F2F" />;
}

function RenderEarrings({ style, lx, rx }: { style: string; lx: number; rx: number }) {
    const gold = '#FFD700';
    const silver = '#C0C0C0';
    const color = gold;

    switch (style) {
        case 'stud':
            return (
                <G>
                    <Circle cx={lx - 2} cy="108" r="2.5" fill={color} />
                    <Circle cx={rx + 2} cy="108" r="2.5" fill={color} />
                </G>
            );
        case 'hoop-small':
            return (
                <G>
                    <Circle cx={lx - 2} cy="112" r="5" fill="none" stroke={color} strokeWidth="1.5" />
                    <Circle cx={rx + 2} cy="112" r="5" fill="none" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'hoop-large':
            return (
                <G>
                    <Circle cx={lx - 2} cy="115" r="9" fill="none" stroke={color} strokeWidth="1.5" />
                    <Circle cx={rx + 2} cy="115" r="9" fill="none" stroke={color} strokeWidth="1.5" />
                </G>
            );
        case 'drop':
            return (
                <G>
                    <Line x1={lx - 2} y1="108" x2={lx - 2} y2="120" stroke={color} strokeWidth="1" />
                    <Circle cx={lx - 2} cy="122" r="3" fill={color} />
                    <Line x1={rx + 2} y1="108" x2={rx + 2} y2="120" stroke={color} strokeWidth="1" />
                    <Circle cx={rx + 2} cy="122" r="3" fill={color} />
                </G>
            );
        case 'bar':
            return (
                <G>
                    <Line x1={lx - 2} y1="108" x2={lx - 2} y2="118" stroke={color} strokeWidth="2" />
                    <Line x1={rx + 2} y1="108" x2={rx + 2} y2="118" stroke={color} strokeWidth="2" />
                </G>
            );
        default:
            return null;
    }
}

function RenderNecklace({ style }: { style: string }) {
    const gold = '#FFD700';

    switch (style) {
        case 'chain':
            return <Path d="M78,168 Q100,178 122,168" stroke={gold} strokeWidth="1.5" fill="none" />;
        case 'pendant':
            return (
                <G>
                    <Path d="M78,168 Q100,178 122,168" stroke={gold} strokeWidth="1" fill="none" />
                    <Circle cx="100" cy="178" r="4" fill={gold} />
                </G>
            );
        case 'choker':
            return <Path d="M72,162 Q100,166 128,162" stroke="#1A1A1A" strokeWidth="2.5" fill="none" />;
        case 'pearls':
            return (
                <G>
                    {[78, 84, 90, 96, 102, 108, 114, 120].map((x, i) => (
                        <Circle key={`p${i}`} cx={x} cy={166 + Math.sin(i * 0.8) * 3} r="2.5" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="0.5" />
                    ))}
                </G>
            );
        default:
            return null;
    }
}

function RenderPiercing({ style }: { style: string }) {
    const silver = '#C0C0C0';

    switch (style) {
        case 'nose-stud':
            return <Circle cx="96" cy="118" r="1.5" fill={silver} />;
        case 'nose-ring':
            return <Circle cx="95" cy="118" r="3" fill="none" stroke={silver} strokeWidth="1" />;
        case 'septum':
            return <Path d="M96,120 Q100,124 104,120" stroke={silver} strokeWidth="1.5" fill="none" />;
        case 'lip':
            return <Circle cx="94" cy="142" r="1.5" fill={silver} />;
        default:
            return null;
    }
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

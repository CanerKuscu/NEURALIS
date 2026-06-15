/**
 * Duolingo-Style Human Eyebrows - Simple, expressive
 */
import React from 'react';
import { G, Path, Ellipse } from 'react-native-svg';

export type EyebrowStyle = 'none' | 'normal' | 'thick' | 'thin' | 'arched' | 'angry' | 'worried' | 'raised';

interface HumanEyebrowsProps {
    style?: EyebrowStyle;
    color?: string;
}

export const HumanEyebrows: React.FC<HumanEyebrowsProps> = ({ style = 'normal', color = '#4A3728' }) => {
    const leftX = 78;
    const rightX = 122;
    const browY = 58;

    const renderEyebrows = () => {
        switch (style) {
            case 'none':
                return null;

            case 'thick':
                // Thick bold eyebrows
                return (
                    <G>
                        <Ellipse cx={leftX} cy={browY} rx="14" ry="4" fill={color} />
                        <Ellipse cx={rightX} cy={browY} rx="14" ry="4" fill={color} />
                    </G>
                );

            case 'thin':
                // Thin delicate eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 12},${browY + 2} Q${leftX},${browY - 2} ${leftX + 12},${browY + 1}`}
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d={`M${rightX - 12},${browY + 1} Q${rightX},${browY - 2} ${rightX + 12},${browY + 2}`}
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </G>
                );

            case 'arched':
                // High arched eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 13},${browY + 4} Q${leftX - 5},${browY - 6} ${leftX + 10},${browY + 2}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d={`M${rightX - 10},${browY + 2} Q${rightX + 5},${browY - 6} ${rightX + 13},${browY + 4}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </G>
                );

            case 'angry':
                // Angry V-shaped eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 12},${browY - 2} L${leftX + 10},${browY + 5}`}
                            stroke={color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                        <Path
                            d={`M${rightX - 10},${browY + 5} L${rightX + 12},${browY - 2}`}
                            stroke={color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                    </G>
                );

            case 'worried':
                // Worried tilted eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 12},${browY + 4} L${leftX + 10},${browY - 3}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <Path
                            d={`M${rightX - 10},${browY - 3} L${rightX + 12},${browY + 4}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </G>
                );

            case 'raised':
                // Raised surprised eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 12},${browY + 2} Q${leftX},${browY - 8} ${leftX + 12},${browY + 2}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d={`M${rightX - 12},${browY + 2} Q${rightX},${browY - 8} ${rightX + 12},${browY + 2}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </G>
                );

            case 'normal':
            default:
                // Normal natural eyebrows
                return (
                    <G>
                        <Path
                            d={`M${leftX - 12},${browY + 1} Q${leftX},${browY - 3} ${leftX + 12},${browY + 1}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d={`M${rightX - 12},${browY + 1} Q${rightX},${browY - 3} ${rightX + 12},${browY + 1}`}
                            stroke={color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </G>
                );
        }
    };

    return <G>{renderEyebrows()}</G>;
};

export default HumanEyebrows;

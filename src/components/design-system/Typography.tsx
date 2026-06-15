import React from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TypographyProps {
    children: React.ReactNode;
    style?: StyleProp<TextStyle>;
    color?: string;
    align?: 'left' | 'center' | 'right';
}

const BaseText: React.FC<TypographyProps & { size: number, weight: TextStyle['fontWeight'] }> = ({
    children,
    style,
    color,
    align = 'left',
    size,
    weight
}) => {
    const { theme } = useTheme();

    return (
        <Text style={[
            {
                fontSize: size,
                fontWeight: weight,
                color: color || theme.text?.primary || '#000',
                textAlign: align,
            },
            style
        ]}>
            {children}
        </Text>
    );
};

export const H1: React.FC<TypographyProps> = (props) => (
    <BaseText {...props} size={32} weight="800" />
);

export const H2: React.FC<TypographyProps> = (props) => (
    <BaseText {...props} size={24} weight="700" />
);

export const H3: React.FC<TypographyProps> = (props) => (
    <BaseText {...props} size={20} weight="600" />
);

export const Body: React.FC<TypographyProps> = (props) => (
    <BaseText {...props} size={16} weight="400" />
);

export const Caption: React.FC<TypographyProps> = (props) => (
    <BaseText {...props} size={12} weight="400" style={[{ opacity: 0.7 }, props.style]} />
);

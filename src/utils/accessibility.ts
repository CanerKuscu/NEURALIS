/**
 * Accessibility Utilities
 *
 * Helpers for ensuring consistent accessibility across the app.
 * Follow WCAG 2.1 AA guidelines for mobile.
 *
 * @example
 * ```tsx
 * <TouchableOpacity {...a11y('Start lesson', 'button', 'Begins a new lesson')}>
 *   <Text>Start</Text>
 * </TouchableOpacity>
 * ```
 */

import type { AccessibilityRole } from 'react-native';

/**
 * Creates accessibility props for a component.
 *
 * @param label - Short, descriptive label read by screen readers
 * @param role - The semantic role (button, header, image, text, etc.)
 * @param hint - Optional additional context for screen reader users
 * @returns Object of React Native accessibility props
 */
export function a11y(
    label: string,
    role: AccessibilityRole = 'text',
    hint?: string,
) {
    return {
        accessible: true,
        accessibilityLabel: label,
        accessibilityRole: role,
        ...(hint ? { accessibilityHint: hint } : {}),
    };
}

/**
 * Creates accessibility props for a button.
 *
 * @param label - Button label for screen readers
 * @param hint - What happens when the button is pressed
 */
export function a11yButton(label: string, hint?: string) {
    return a11y(label, 'button', hint);
}

/**
 * Creates accessibility props for a header.
 *
 * @param label - Header text for screen readers
 */
export function a11yHeader(label: string) {
    return a11y(label, 'header');
}

/**
 * Creates accessibility props for an image.
 *
 * @param label - Image description for screen readers
 */
export function a11yImage(label: string) {
    return a11y(label, 'image');
}

/**
 * Minimum touch target size per WCAG 2.1 AA (44×44 dp).
 */
export const MIN_TOUCH_TARGET = {
    minWidth: 44,
    minHeight: 44,
};

/**
 * Contrast ratio checker for WCAG compliance.
 * Returns true if the contrast ratio meets AA standard (4.5:1 for text).
 *
 * @param foreground - Hex color string (e.g., '#FFFFFF')
 * @param background - Hex color string (e.g., '#000000')
 * @returns Whether the contrast ratio meets WCAG AA
 */
export function meetsContrastRatio(foreground: string, background: string): boolean {
    const getLuminance = (hex: string): number => {
        const rgb = hex
            .replace('#', '')
            .match(/.{2}/g)!
            .map((c) => {
                const v = parseInt(c, 16) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return ratio >= 4.5;
}

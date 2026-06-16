/**
 * MotiComponents - Reusable animated components powered by Moti
 *
 * Provides pre-built, performant animation primitives using Reanimated 2
 * underneath. These replace manual Animated.timing/spring calls with
 * declarative, auto-optimized animations.
 *
 * @example
 * ```tsx
 * <FadeIn delay={200}>
 *   <Text>Hello</Text>
 * </FadeIn>
 *
 * <ScalePress onPress={handleTap}>
 *   <Card />
 * </ScalePress>
 *
 * <SlideInFromBottom>
 *   <BottomSheet />
 * </SlideInFromBottom>
 * ```
 */

import React, { useCallback } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';

// ─── Fade In ─────────────────────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Smoothly fades in its children from opacity 0 to 1.
 * Uses layout animations on the native thread for 60 fps.
 */
export const FadeIn: React.FC<FadeInProps> = React.memo(
  ({ children, delay = 0, duration = 350, style }) => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration, delay }}
      style={style}
    >
      {children}
    </MotiView>
  ),
);

FadeIn.displayName = 'FadeIn';

// ─── Slide In From Bottom ────────────────────────────────────────────────────

interface SlideInProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

/**
 * Slides content up from below the viewport with a spring animation.
 */
export const SlideInFromBottom: React.FC<SlideInProps> = React.memo(
  ({ children, delay = 0, distance = 50, style }) => (
    <MotiView
      from={{ opacity: 0, translateY: distance }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 120,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  ),
);

SlideInFromBottom.displayName = 'SlideInFromBottom';

// ─── Scale Press ─────────────────────────────────────────────────────────────

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleValue?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Wraps children in a pressable that scales down on press for tactile feedback.
 * More performant than Animated.spring because it runs on the UI thread.
 */
export const ScalePress: React.FC<ScalePressProps> = React.memo(
  ({ children, onPress, scaleValue = 0.95, disabled = false, style }) => {
    const [pressed, setPressed] = React.useState(false);

    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={style}
      >
        <MotiView
          animate={{
            scale: pressed ? scaleValue : 1,
          }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 200,
          }}
        >
          {children}
        </MotiView>
      </Pressable>
    );
  },
);

ScalePress.displayName = 'ScalePress';

// ─── Stagger Container ──────────────────────────────────────────────────────

interface StaggerProps {
  children: React.ReactNode[];
  delayIncrement?: number;
  style?: ViewStyle;
}

/**
 * Renders children with staggered fade-in animations.
 * Each child appears `delayIncrement` ms after the previous one.
 */
export const Stagger: React.FC<StaggerProps> = React.memo(
  ({ children, delayIncrement = 80, style }) => (
    <MotiView style={style}>
      {React.Children.map(children, (child, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 300,
            delay: index * delayIncrement,
          }}
        >
          {child}
        </MotiView>
      ))}
    </MotiView>
  ),
);

Stagger.displayName = 'Stagger';

// ─── Animated Number ─────────────────────────────────────────────────────────

interface AnimatedNumberTextProps {
  value: string;
  style?: any;
}

/**
 * Animated text that fades in when the value changes.
 */
export const AnimatedNumberText: React.FC<AnimatedNumberTextProps> = React.memo(
  ({ value, style }) => (
    <AnimatePresence exitBeforeEnter>
      <MotiText
        key={value}
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ type: 'spring', damping: 12 }}
        style={style}
      >
        {value}
      </MotiText>
    </AnimatePresence>
  ),
);

AnimatedNumberText.displayName = 'AnimatedNumberText';

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Pulsing skeleton placeholder for loading states.
 */
export const Skeleton: React.FC<SkeletonProps> = React.memo(
  ({ width, height, borderRadius = 8, style }) => (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 0.7 }}
      transition={{
        type: 'timing',
        duration: 800,
        loop: true,
      }}
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        style,
      ]}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export { AnimatePresence } from 'moti';

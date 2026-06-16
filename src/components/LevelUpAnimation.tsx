import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LevelUpAnimationProps {
  visible: boolean;
  level: number;
  onEnd?: () => void;
}

export const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({ visible, level, onEnd }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => onEnd && onEnd());
        }, 1200);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <MaterialCommunityIcons name="rocket-launch" size={64} color="#7c3aed" />
        <Text style={styles.text}>Seviye {level}!</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: '#7c3aed',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});

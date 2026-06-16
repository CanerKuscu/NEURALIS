import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Volume2 } from 'lucide-react-native';

interface TTSButtonProps {
  text: string;
  language?: string;
  size?: number;
  color?: string;
}

export default function TTSButton({
  text,
  language = 'en',
  size = 24,
  color = '#1CB0F6',
}: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop any in-flight speech if the component unmounts.
  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );

  const speak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      Speech.speak(text, {
        language,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <TouchableOpacity onPress={speak} style={styles.container} activeOpacity={0.7}>
      {isSpeaking ? (
        <ActivityIndicator size={size} color={color} />
      ) : (
        <Volume2 size={size} color={color} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(28, 176, 246, 0.15)', // Light blue background
    alignItems: 'center',
    justifyContent: 'center',
  },
});

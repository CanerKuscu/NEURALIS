import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { authService } from '../../src/services/AuthService';
import { supabase } from '../../src/config/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, RefreshCw, Mail } from 'lucide-react-native'; // Cleaned up imports
import { useToast } from '../../src/context/ToastContext';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Auto-focus first input
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 500);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto advance
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (text && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (verificationCode: string) => {
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await authService.verifyOtp(email, verificationCode, 'signup');

      if (error) throw error;

      showToast('Email verified successfully!', {
        type: 'success',
        title: 'Success',
        duration: 2000,
      });

      // Delay redirect slightly to show toast
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error: any) {
      showToast('Invalid code. Please try again.', { type: 'error', title: 'Verification Failed' });
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      showToast('New code sent to your email.', { type: 'info', title: 'Sent' });
    } catch (error: any) {
      showToast(error.message || 'Failed to resend code.', { type: 'error', title: 'Error' });
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background.primary, COLORS.background.secondary]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Mail size={48} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            We sent a code to {email || 'your email'}. Please enter it below.
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => verifyCode(code.join(''))}
            disabled={loading || code.some((c) => !c)}
          >
            <LinearGradient
              colors={code.some((c) => !c) ? ['#ccc', '#bbb'] : [COLORS.primary, '#4ade80']}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Verify</Text>
                  <Check size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
            <RefreshCw size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.resendText}>{resending ? 'Sending...' : 'Resend Code'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.tertiary,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  verifyButton: {
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  gradientButton: {
    height: 56,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

/**
 * NEURALIS - Login Screen
 * Email/password authentication with Supabase.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../../src/services/AuthService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import i18n from '../../src/i18n';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleLogin = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) newErrors.email = i18n.t('auth.email_required');
    if (!password) newErrors.password = i18n.t('auth.password_required');

    // ... (rest of logic)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.login({ email, password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrors({ form: err.message || i18n.t('auth.login_failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Rich Background */}
      <LinearGradient
        colors={['#E0F7FA', '#FFF', '#E8F5E9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.mascotContainer}>
            <Text style={{ fontSize: 80 }}>🦊</Text>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.welcomeText}>
            {i18n.t('auth.welcome_back')}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.subText}>
            {i18n.t('auth.continue_streak')}
          </Animated.Text>
        </View>

        {/* Form Section */}
        <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.formCard}>
          {/* Global Error Banner */}
          {errors.form ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.form}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{i18n.t('auth.email_label')}</Text>
            <View style={[styles.inputWrapper, errors.email && styles.errorBorder]}>
              <Mail size={20} color={errors.email ? '#E74C3C' : '#95A5A6'} />
              <TextInput
                style={styles.input}
                placeholder="hello@neuralis.app"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#BDC3C7"
                accessibilityLabel={i18n.t('auth.email_label')}
                accessibilityRole="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{i18n.t('auth.password_label')}</Text>
            <View style={[styles.inputWrapper, errors.password && styles.errorBorder]}>
              <Lock size={20} color={errors.password ? '#E74C3C' : '#95A5A6'} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry={!showPassword}
                placeholderTextColor="#BDC3C7"
                accessibilityLabel={i18n.t('auth.password_label')}
                accessibilityRole="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#95A5A6" />
                ) : (
                  <Eye size={20} color="#95A5A6" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: 12 }}
            >
              <Text style={styles.forgotText}>{i18n.t('auth.forgot_password')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginBtn}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('auth.login_btn')}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.btnText}>{i18n.t('auth.login_btn')}</Text>
                  <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <Text style={styles.footerText}>{i18n.t('auth.no_account')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupText}>{i18n.t('auth.create_account')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 30 },
  mascotContainer: {
    marginBottom: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  mascot: { width: 120, height: 120 },
  welcomeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subText: { fontSize: 16, color: '#7F8C8D', fontWeight: '500' },

  formCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  errorBannerText: { color: '#E74C3C', fontWeight: '600', fontSize: 14, textAlign: 'center' },

  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  errorBorder: {
    borderColor: '#E74C3C',
    backgroundColor: '#FEF9E7',
  },
  errorText: { color: '#E74C3C', fontSize: 12, fontWeight: '600', marginTop: 4, marginLeft: 4 },

  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2C3E50' },

  forgotText: { color: '#BDC3C7', fontWeight: '700', fontSize: 14 },

  loginBtn: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#2ECC71',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  gradientBtn: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', marginBottom: 20 },
  footerText: { color: '#95A5A6', fontSize: 15, fontWeight: '600' },
  signupText: { color: '#2ECC71', fontWeight: '800', fontSize: 15 },
});

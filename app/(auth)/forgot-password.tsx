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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, ArrowRight, Lock } from 'lucide-react-native';
import { authService } from '../../src/services/AuthService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    setErrors({});
    setSuccessMessage('');

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authService.sendPasswordReset(email);
      if (error) throw error;
      setSuccessMessage('Password reset instructions sent! Check your email.');
    } catch (error: any) {
      setErrors({ form: error.message || 'Failed to send reset email.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF', '#E8F5E9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={[
              styles.iconContainer,
              { backgroundColor: '#E8F5E9', borderRadius: 50, padding: 20 },
            ]}
          >
            <Lock size={60} color="#2ECC71" strokeWidth={2.5} />
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(300)} style={styles.title}>
            Forgot Password?
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.subtitle}>
            Don't worry! It happens. Please enter the email associated with your account.
          </Animated.Text>

          <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.formCard}>
            {/* Status Banners */}
            {errors.form ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.form}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View
                style={[styles.errorBanner, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}
              >
                <Text style={[styles.errorBannerText, { color: '#2ECC71' }]}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.errorBorder]}>
                <Mail size={20} color={errors.email ? '#E74C3C' : '#95A5A6'} />
                <TextInput
                  style={styles.input}
                  placeholder="hello@example.com"
                  placeholderTextColor="#BDC3C7"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <TouchableOpacity onPress={handleReset} disabled={loading} style={styles.resetBtn}>
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
                    <Text style={styles.btnText}>SEND RESET LINK</Text>
                    <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, marginBottom: 10 },
  backBtn: { padding: 8, marginLeft: -8, alignSelf: 'flex-start' },

  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },

  iconContainer: {
    marginBottom: 24,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  lockIcon: { width: 100, height: 100 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  formCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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

  resetBtn: {
    marginTop: 10,
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
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  ChevronLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authService } from '../../src/services/AuthService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AvatarV2View from '../../src/components/avatar/AvatarV2View'; // Instagram-style avatar
import i18n from '../../src/i18n';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Password Complexity Regex
  // At least 8 characters, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char (matches AuthService)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) newErrors.firstName = i18n.t('auth.name_required');
    if (!lastName.trim()) newErrors.lastName = i18n.t('auth.name_required');

    if (!birthDate) {
      newErrors.birthDate = i18n.t('auth.dob_required');
    } else {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 13) {
        newErrors.birthDate = i18n.t('auth.age_restriction');
      }
    }

    if (!email.trim()) {
      newErrors.email = i18n.t('auth.email_required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = i18n.t('auth.invalid_email');
    }

    if (!password) {
      newErrors.password = i18n.t('auth.password_required');
    } else if (!passwordRegex.test(password)) {
      newErrors.password = i18n.t('auth.password_weak');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = i18n.t('auth.passwords_no_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await authService.signUp({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate!, // We validated it's not null
        gender: 'other',
      });

      if (error) throw error;
      // Success - Redirect to Verification Screen
      router.replace({
        pathname: '/(auth)/verification',
        params: { email },
      });
    } catch (err: any) {
      setErrors({ form: err.message || i18n.t('auth.signup_failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={router.back} style={styles.backBtn}>
              <ChevronLeft size={24} color="#7F8C8D" />
            </TouchableOpacity>

            <Animated.View entering={FadeInUp.delay(200)} style={{ alignItems: 'center' }}>
              <AvatarV2View
                size={120}
                config={{
                  skinTone: '#F5CBA7',
                  hairStyle: 'short-classic',
                  hairColor: '#3D2B1F',
                  eyeShape: 'default',
                  eyeColor: '#5D4037',
                  expression: 'smile',
                  outfitTop: 'tshirt',
                  outfitColor: '#2ECC71',
                }}
                showBg={false}
              />
              <Text style={styles.welcomeText}>{i18n.t('auth.create_account_title')}</Text>
              <Text style={styles.subText}>{i18n.t('auth.start_journey')}</Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <Animated.View entering={FadeInDown.springify().delay(200)} style={styles.formCard}>
            {/* Global Error Message */}
            {errors.form ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.form}</Text>
              </View>
            ) : null}

            {/* First & Last Name Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>{i18n.t('auth.first_name')}</Text>
                <View style={[styles.inputWrapper, errors.firstName && styles.errorBorder]}>
                  <User size={20} color={errors.firstName ? '#E74C3C' : '#95A5A6'} />
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    value={firstName}
                    onChangeText={(t) => {
                      setFirstName(t);
                      if (errors.firstName) setErrors({ ...errors, firstName: '' });
                    }}
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>{i18n.t('auth.last_name')}</Text>
                <View style={[styles.inputWrapper, errors.lastName && styles.errorBorder]}>
                  <TextInput
                    style={[styles.input, { marginLeft: 5 }]}
                    placeholder="Doe"
                    value={lastName}
                    onChangeText={(t) => {
                      setLastName(t);
                      if (errors.lastName) setErrors({ ...errors, lastName: '' });
                    }}
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{i18n.t('auth.date_of_birth')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <View style={[styles.inputWrapper, errors.birthDate && styles.errorBorder]}>
                  <Calendar size={20} color={errors.birthDate ? '#E74C3C' : '#95A5A6'} />
                  <Text
                    style={[
                      styles.input,
                      { paddingVertical: 18, color: birthDate ? '#2C3E50' : '#BDC3C7' },
                    ]}
                  >
                    {birthDate ? birthDate.toLocaleDateString() : i18n.t('auth.select_birthday')}
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

              {showDatePicker && (
                <DateTimePicker
                  value={birthDate || new Date(2005, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    // On Android, the picker closes automatically. On iOS we might need to toggle.
                    // For this implementation, we will close it on selection for Android, and toggle for iOS logic if needed,
                    // but since we added a 'Done' button for iOS below, we just update state.
                    if (Platform.OS === 'android') setShowDatePicker(false);

                    if (selectedDate) {
                      setBirthDate(selectedDate);
                      if (errors.birthDate) setErrors({ ...errors, birthDate: '' });
                    }
                    if (event.type === 'dismissed') setShowDatePicker(false);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      backgroundColor: '#2ECC71',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{i18n.t('auth.email_label')}</Text>
              <View style={[styles.inputWrapper, errors.email && styles.errorBorder]}>
                <Mail size={20} color={errors.email ? '#E74C3C' : '#95A5A6'} />
                <TextInput
                  style={styles.input}
                  placeholder="hello@example.com"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#BDC3C7"
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
              <Text style={styles.helperText}>{i18n.t('auth.password_weak')}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{i18n.t('auth.confirm_password')}</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.errorBorder]}>
                <CheckCircle size={20} color={errors.confirmPassword ? '#E74C3C' : '#95A5A6'} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#BDC3C7"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#95A5A6" />
                  ) : (
                    <Eye size={20} color="#95A5A6" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} style={styles.loginBtn}>
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
                    <Text style={styles.btnText}>{i18n.t('auth.join_btn')}</Text>
                    <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text
              style={{
                color: '#888',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 12,
                lineHeight: 18,
              }}
            >
              {i18n.t('auth.terms_agreement')}{' '}
              <Text
                style={{ color: '#2ECC71', textDecorationLine: 'underline' }}
                onPress={() => router.push('/legal?tab=terms')}
              >
                {i18n.t('auth.terms_of_service')}
              </Text>{' '}
              {i18n.t('auth.and')}{' '}
              <Text
                style={{ color: '#2ECC71', textDecorationLine: 'underline' }}
                onPress={() => router.push('/legal?tab=privacy')}
              >
                {i18n.t('auth.privacy_policy')}
              </Text>
              {"'"}nı kabul etmiş olursunuz.
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{i18n.t('auth.have_account')} </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.signupText}>{i18n.t('auth.log_in')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  backBtn: { marginBottom: 10, alignSelf: 'flex-start', padding: 8, marginLeft: -8 },
  welcomeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subText: { fontSize: 16, color: '#7F8C8D', fontWeight: '500' },

  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
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

  inputContainer: { marginBottom: 16 },
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
  helperText: { color: '#95A5A6', fontSize: 11, marginTop: 4, marginLeft: 4 },

  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2C3E50', height: '100%' },

  loginBtn: {
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
    gap: 8,
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#95A5A6', fontSize: 15, fontWeight: '600' },
  signupText: { color: '#2ECC71', fontWeight: '800', fontSize: 15 },
});

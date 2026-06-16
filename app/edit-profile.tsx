import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Save, Calendar } from 'lucide-react-native';
import { supabase } from '../src/config/supabase';
import { useTheme } from '../src/context/ThemeContext';
import { RADIUS } from '../src/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../src/context/ToastContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    birth_date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, email, birth_date')
        .eq('id', session.user.id)
        .single();

      setFormData({
        first_name: data?.first_name || session.user.user_metadata?.first_name || '',
        last_name: data?.last_name || session.user.user_metadata?.last_name || '',
        email: session.user.email || '',
        birth_date: data?.birth_date ? new Date(data.birth_date) : new Date(2000, 0, 1),
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      try {
        console.log('[EditProfile] Saving profile for user:', session.user.id);
        console.log('[EditProfile] Form data:', formData);

        // Update Auth Metadata
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            birth_date: formData.birth_date.toISOString(),
          },
        });

        if (authError) {
          console.error('[EditProfile] Auth metadata update error:', authError);
        } else {
          console.log('[EditProfile] Auth metadata updated successfully');
        }

        // UPSERT Profile Table - creates row if not exists, updates if exists
        const upsertPayload = {
          id: session.user.id, // Required for upsert
          email: session.user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          display_name: `${formData.first_name} ${formData.last_name}`.trim(),
          birth_date: formData.birth_date.getTime(), // Send as timestamp number (bigint)
          updated_at: new Date().toISOString(),
        };
        console.log('[EditProfile] Upsert payload:', upsertPayload);

        const { data: upsertData, error: dbError } = await supabase
          .from('profiles')
          .upsert(upsertPayload, { onConflict: 'id' })
          .select();

        console.log('[EditProfile] DB upsert result:', { data: upsertData, error: dbError });

        if (dbError) {
          console.error('[EditProfile] Profile upsert error:', dbError);
          showToast(`DB Error: ${dbError.message}`, { type: 'error' });
        } else {
          console.log('[EditProfile] Profile upserted in DB:', upsertData);
          showToast('Profile updated successfully!', { type: 'success' });
        }

        router.back();
      } catch (err: any) {
        console.error('[EditProfile] Exception:', err);
        showToast(err.message || 'Failed to update profile', { type: 'error' });
      }
    }
    setSaving(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, birth_date: selectedDate }));
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.primary, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>First Name</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
              ]}
            >
              <User size={20} color={theme.text.muted} />
              <TextInput
                style={[styles.input, { color: theme.text.primary }]}
                value={formData.first_name}
                onChangeText={(t) => setFormData({ ...formData, first_name: t })}
                placeholder="First Name"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Last Name</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
              ]}
            >
              <User size={20} color={theme.text.muted} />
              <TextInput
                style={[styles.input, { color: theme.text.primary }]}
                value={formData.last_name}
                onChangeText={(t) => setFormData({ ...formData, last_name: t })}
                placeholder="Last Name"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          {/* Email (Read Only) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Email (Locked)</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.background.tertiary, borderColor: theme.border.light },
              ]}
            >
              <Mail size={20} color={theme.text.muted} />
              <TextInput
                style={[styles.input, { color: theme.text.muted }]}
                value={formData.email}
                editable={false}
              />
            </View>
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Date of Birth</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
              ]}
            >
              <Calendar size={20} color={theme.text.muted} />
              <Text style={[styles.input, { color: theme.text.primary, paddingTop: 4 }]}>
                {formData.birth_date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.birth_date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.saveText}>Save Changes</Text>
                <Save size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  iconBtn: { padding: 8 },
  content: { padding: 24, paddingBottom: 50 },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: RADIUS.button,
    gap: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

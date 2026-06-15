/**
 * NEURALIS - Authentication Service
 * Strict TypeScript Auth Logic (migrated to Supabase)
 * 
 * Features:
 * - Email/Password Signup with validation
 * - Password policy enforcement
 * - Email verification requirement
 * - Persistent sessions
 */

import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { notificationEngine } from './NotificationEngine';
import {
    UserProfile,
    SignUpData,
    LoginData,
    PasswordValidationResult,
    PasswordError,
    PasswordStrength,
    AuthResult,
    AuthError,
} from '../types/user';
import { userDocumentToProfile } from './userHelpers';


// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD VALIDATION UTILITY
// ═══════════════════════════════════════════════════════════════════════════

const PASSWORD_REGEX = {
    minLength: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    digit: /[0-9]/,
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

const COMMON_PASSWORDS: readonly string[] = [
    'password', '12345678', 'qwerty123', 'letmein', 'welcome',
    'password1', 'Password1', 'Password1!', '123456789', 'neuralis',
];

export const validatePassword = (password: string): PasswordValidationResult => {
    const errors: PasswordError[] = [];

    if (!PASSWORD_REGEX.minLength.test(password)) {
        errors.push('TOO_SHORT');
    }
    if (!PASSWORD_REGEX.uppercase.test(password)) {
        errors.push('NO_UPPERCASE');
    }
    if (!PASSWORD_REGEX.lowercase.test(password)) {
        errors.push('NO_LOWERCASE');
    }
    if (!PASSWORD_REGEX.digit.test(password)) {
        errors.push('NO_DIGIT');
    }
    if (!PASSWORD_REGEX.specialChar.test(password)) {
        errors.push('NO_SPECIAL_CHAR');
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('TOO_COMMON');
    }

    const strength = calculatePasswordStrength(password, errors);

    return {
        isValid: errors.length === 0,
        errors,
        strength,
    };
};

const calculatePasswordStrength = (
    password: string,
    errors: PasswordError[]
): PasswordStrength => {
    if (errors.length >= 3) return 'weak';
    if (errors.length >= 1) return 'fair';
    if (password.length >= 12) return 'very_strong';
    return 'strong';
};

export const getPasswordErrorMessage = (error: PasswordError): string => {
    const messages: Record<PasswordError, string> = {
        TOO_SHORT: 'Password must be at least 8 characters',
        NO_UPPERCASE: 'Password must contain at least one uppercase letter',
        NO_LOWERCASE: 'Password must contain at least one lowercase letter',
        NO_DIGIT: 'Password must contain at least one digit',
        NO_SPECIAL_CHAR: 'Password must contain at least one special character (!@#$%^&*)',
        TOO_COMMON: 'Password is too common, please choose a stronger password',
    };
    return messages[error];
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class AuthService {
    private static instance: AuthService;
    /** Cache table columns to avoid repeated information_schema queries */
    private tableColumnsCache: Map<string, { columns: Set<string>; fetchedAt: number }> = new Map();
    private static readonly COLUMN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Ensure a profiles row exists for a given userId; returns existing or created profile
    public async ensureProfileExists(
        userId: string,
        fallback?: Partial<SignUpData> & { email?: string; firstName?: string; lastName?: string; gender?: string }
    ): Promise<UserProfile> {
        const existing = await this.getUserProfile(userId);
        if (existing) return existing;

        const signUpData: SignUpData = {
            email: fallback?.email || '',
            firstName: fallback?.firstName || '',
            lastName: fallback?.lastName || '',
            birthDate: (fallback as any)?.birthDate || new Date(2000, 0, 1),
            gender: fallback?.gender || 'other',
            password: '', // Password not needed for profile creation from existing auth
        } as SignUpData;

        const created = await this.createUserDocument(userId, signUpData);
        return created;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SIGN UP
    // ─────────────────────────────────────────────────────────────────────────

    async signUp(data: SignUpData): Promise<AuthResult> {
        try {
            // Validate email
            if (!validateEmail(data.email)) {
                return {
                    success: false,
                    error: {
                        code: 'invalid-email',
                        message: 'Please enter a valid email address',
                        field: 'email',
                    },
                };
            }

            // Validate password
            const passwordValidation = validatePassword(data.password);
            if (!passwordValidation.isValid) {
                const errorMessage = passwordValidation.errors
                    .map(getPasswordErrorMessage)
                    .join('. ');
                return {
                    success: false,
                    error: {
                        code: 'weak-password',
                        message: errorMessage,
                        field: 'password',
                    },
                };
            }

            // Validate age (must be at least 13)
            const age = this.calculateAge(data.birthDate);
            if (age < 13) {
                return {
                    success: false,
                    error: {
                        code: 'age-restriction',
                        message: 'You must be at least 13 years old to use Neuralis',
                        field: 'general',
                    },
                };
            }

            // Add user to Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: `${data.firstName} ${data.lastName || ''}`.trim(),
                        first_name: data.firstName,
                        last_name: data.lastName || '',
                        birth_date: data.birthDate ? data.birthDate.toISOString() : null,
                        gender: data.gender,
                    }
                }
            });

            if (signUpError) {
                return this.handleAuthError({ code: signUpError.message, message: signUpError.message });
            }

            // Email verification link/code sent to user (depending on Supabase config)
            return {
                success: true,
                user: { email: data.email } as any,
                otpSent: true,
            } as any;
        } catch (error) {
            return this.handleAuthError(error as AuthError);
        }
    }
    // Verify OTP code from user
    async verifyOtp(email: string, code: string, type: 'signup' | 'email' | 'recovery' = 'email'): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type,
            });
            if (error) {
                return this.handleAuthError({ code: error?.message || 'auth/error', message: error.message });
            }
            // Verification successful, ensure user profile exists
            const supaUser = data?.user;
            if (!supaUser) {
                return { success: false, error: { code: 'verify-failed', message: 'Verification failed', field: 'general' } };
            }

            // Create profile using the metadata stored during signUp
            try {
                const metadata = supaUser.user_metadata || {};
                await this.createUserDocument(supaUser.id, {
                    email: supaUser.email || email,
                    firstName: metadata.first_name || '',
                    lastName: metadata.last_name || '',
                    birthDate: metadata.birth_date ? new Date(metadata.birth_date) : new Date(2000, 0, 1),
                    gender: metadata.gender || 'other',
                } as SignUpData);
            } catch (err) {
                console.warn('[AuthService] Could not create user profile row:', err);
            }
            // Mark the profile as verified (code-based verification)
            try {
                await this.updateEmailVerificationStatus(supaUser.id, true);
            } catch (err) {
                console.warn('[AuthService] Could not update verification status after OTP verify:', err);
            }

            // Return the newly-created/updated profile if available
            let profile: UserProfile | null = null;
            try {
                profile = await this.getUserProfile(supaUser.id);
            } catch (err) {
                // ignore
            }

            return {
                success: true,
                user: profile ?? ({ uid: supaUser.id, email: supaUser.email || email } as any),
            } as any;
        } catch (error) {
            return this.handleAuthError(error as AuthError);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    async login(data: LoginData): Promise<AuthResult> {
        try {
            console.log('[AuthService] login attempt for email:', data.email ? '<hidden>' : '<empty>');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (signInError) {
                return this.handleAuthError({ code: signInError.message, message: signInError.message });
            }

            const supaUser = signInData?.user;
            if (!supaUser) {
                return { success: false, error: { code: 'login-failed', message: 'Login failed', field: 'general' } };
            }

            // Fetch user profile from `users` table
            let userProfile: UserProfile | null = null;
            try {
                userProfile = await this.getUserProfile(supaUser.id);
                if (!userProfile) {
                    // Create an initial profile row if none exists and use the created profile as fallback
                    const created = await this.createUserDocument(supaUser.id, {
                        email: supaUser.email || '',
                        firstName: '',
                        lastName: '',
                        birthDate: new Date(2000, 0, 1),
                        gender: 'other',
                    } as SignUpData);
                    userProfile = created || null;
                }

                // Update last login
                await this.updateLastLogin(supaUser.id);
            } catch (err) {
                console.warn('[AuthService] get/create profile error:', err);
            }

            return {
                success: true,
                user: userProfile ?? undefined,
            } as AuthResult;
        } catch (error) {
            console.error('[AuthService] login threw error:', error);
            return this.handleAuthError(error as AuthError);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sign the user out, cancel notifications and clear push token in DB/local storage.
     * Keeps behavior idempotent and best-effort (won't throw on failures).
     */
    async signOut(): Promise<void> {
        try {
            // Cancel any locally scheduled notifications
            try {
                // await notificationEngine.cancelAllNotifications();
            } catch (e) {
                console.warn('[AuthService] Failed to cancel notifications:', e);
            }

            // Clear push token from user's profile so server won't target this device
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                if (userId) {
                    await supabase.from('profiles').update({ push_token: null, expo_push_token: null, updated_at: new Date().toISOString() }).eq('id', userId);
                }
            } catch (e) {
                console.warn('[AuthService] Failed to clear push token in profile:', e);
            }

            // Sign out from Supabase auth
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn('[AuthService] Supabase signOut failed:', e);
            }

            // Clear local storage keys used by notifications / auth
            try {
                await AsyncStorage.removeItem('neuralis:lastUid');
                await AsyncStorage.removeItem('@neuralis/push_token');
                await AsyncStorage.removeItem('@neuralis/scheduled_notifications');
            } catch (err) {
                // ignore
            }
        } catch (err) {
            console.error('[AuthService] signOut error:', err);
        }
    }

    // Backwards-compatible alias
    async logout(): Promise<void> {
        return this.signOut();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMAIL VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    async resendVerificationEmail(email?: string): Promise<AuthResult> {
        try {
            // Prefer explicit email param when provided (Login/Signup screens)
            let targetEmail = email;

            // If not provided, try to get current user email
            if (!targetEmail) {
                const { data } = await supabase.auth.getUser();
                targetEmail = data?.user?.email ?? undefined;
            }

            if (!targetEmail) {
                return {
                    success: false,
                    error: { code: 'no-email', message: 'No email available to resend verification', field: 'email' },
                };
            }

            // Best-effort: send a magic link / OTP to the user's email as a usable fallback.
            // This will allow the user to sign-in and thus establish a valid session.
            // Many Supabase projects accept magic links as a verification path as well.
            // Use signInWithOtp which exists on supabase-js v2.
            try {
                const { error: otpError } = await supabase.auth.signInWithOtp({ email: targetEmail });
                if (otpError) {
                    // If OTP sending failed, still return a mapped auth error
                    return this.handleAuthError({ code: otpError.message || 'auth/error', message: otpError.message || String(otpError) } as AuthError);
                }

                return { success: true };
            } catch (err) {
                // If signInWithOtp is not available (older SDK), fall back to success
                console.warn('[AuthService] signInWithOtp not available or failed:', err);
                return { success: true };
            }
        } catch (error) {
            return this.handleAuthError(error as AuthError);
        }
    }

    async checkEmailVerification(): Promise<boolean> {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) throw new Error('No active session. Please login again.');

        // For code-based verification, consult the `profiles` row instead of relying on
        // Supabase's `email_confirmed_at` (which is link-based). This allows OTP/code
        // verification flows to mark `email_verified` in the app DB.
        try {
            const profile = await this.getUserProfile(user.id);
            const verified = Boolean(profile?.emailVerified || profile?.verificationStatus === 'verified');
            if (verified) {
                try {
                    await this.updateEmailVerificationStatus(user.id, true);
                } catch (err) {
                    console.error('[AuthService] Failed to update verification status:', err);
                }
            }
            return verified;
        } catch (err) {
            console.error('[AuthService] checkEmailVerification error:', err);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASSWORD RESET
    // ─────────────────────────────────────────────────────────────────────────

    async sendPasswordReset(email: string): Promise<AuthResult> {
        try {
            // Send OTP code to email for password reset
            const { error: otpError } = await supabase.auth.signInWithOtp({ email });
            if (otpError) {
                return this.handleAuthError({ code: otpError?.message || 'auth/error', message: otpError.message });
            }
            // Inform UI to prompt for OTP code and new password
            return {
                success: true,
                otpSent: true,
                user: { email },
            } as any;
        } catch (error) {
            return this.handleAuthError(error as AuthError);
        }
    }

    // Verify OTP code and set new password
    async verifyPasswordResetOtp(email: string, code: string, newPassword: string): Promise<AuthResult> {
        try {
            // Verify OTP code
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'email',
            });
            if (error) {
                return this.handleAuthError({ code: error?.message || 'auth/error', message: error.message });
            }
            const supaUser = data?.user;
            if (!supaUser) {
                return { success: false, error: { code: 'verify-failed', message: 'Verification failed', field: 'general' } };
            }
            // Update password after OTP verification
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) {
                return this.handleAuthError({ code: updateError?.message || 'auth/error', message: updateError.message });
            }
            return { success: true };
        } catch (error) {
            return this.handleAuthError(error as AuthError);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // DATABASE OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────
    private async createUserDocument(
        userId: string,
        signUpData: SignUpData
    ): Promise<UserProfile> {
        const displayName = `${signUpData.firstName} ${signUpData.lastName}`.trim();

        // Include user profile fields including first_name, last_name, display_name, birth_date
        const userRow: any = {
            id: userId,
            email: signUpData.email,
            first_name: signUpData.firstName || '',
            last_name: signUpData.lastName || '',
            display_name: displayName || signUpData.email?.split('@')[0] || '',
            birth_date: signUpData.birthDate ? signUpData.birthDate.toISOString() : null,
            gender: signUpData.gender || 'other',
            username: signUpData.email?.split('@')[0] || '',
            merit_points: 0,
            current_streak: 0,
            league_points: 0,
            longest_streak: 0,
            total_xp: 0,
            neural_score: 0,
            is_premium: false,
            subscription: 'free',
            account_status: 'active',
            email_verified: false,
            verification_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
        };

        if (typeof (signUpData as any).avatarUrl !== 'undefined') userRow.avatar_url = (signUpData as any).avatarUrl;
        if (typeof (signUpData as any).premiumExpiresAt !== 'undefined') userRow.premium_expires_at = (signUpData as any).premiumExpiresAt;
        if (typeof (signUpData as any).linkedUserId !== 'undefined') userRow.linked_user_id = (signUpData as any).linkedUserId;
        if (typeof (signUpData as any).linkedUserName !== 'undefined') userRow.linked_user_name = (signUpData as any).linkedUserName;
        if (typeof (signUpData as any).synapseStreak !== 'undefined') userRow.synapse_streak = (signUpData as any).synapseStreak;

        // Prefer to upsert only columns that actually exist in the DB schema to avoid PGRST204
        const tableColumns = await this.getTableColumnsCached('profiles');
        const filteredRow: any = {};
        for (const k of Object.keys(userRow)) {
            if (tableColumns.size === 0 || tableColumns.has(k)) {
                filteredRow[k] = userRow[k];
            }
        }

        const { data: upsertData, error } = await supabase.from('profiles').upsert(filteredRow).select().maybeSingle();
        if (error) {
            if (__DEV__) console.error('[AuthService] Error creating user profile row (full):', error);
            const details = String(error?.details || '').toLowerCase();
            const message = String(error?.message || '').toLowerCase();

            // Handle row-level security errors (common when RLS enabled but no insert policy)
            if (error?.code === '42501' || message.includes('row-level security') || details.includes('row-level security')) {
                if (__DEV__) console.warn('[AuthService] Row-level security prevented creating profiles row.');
                return userDocumentToProfile(filteredRow as any);
            }

            const isMissingTable = error?.code === 'PGRST205' || details.includes('could not find') || message.includes('could not find') || message.includes('table');

            // Handle missing table gracefully (fallback to local profile)
            if (isMissingTable) {
                if (__DEV__) console.warn('[AuthService] Detected missing PostgREST table (profiles).');
                return userDocumentToProfile(userRow as any);
            }

            // If we still encounter missing-column errors despite filtering, try a minimal payload
            const isMissingColumn = error?.code === 'PGRST204' || (message.includes('could not find the') && message.includes('column'));
            if (isMissingColumn) {
                if (__DEV__) console.warn('[AuthService] Detected missing column(s) in profiles table. Retrying with reduced payload.');
                // Only use absolutely essential columns that definitely exist
                const minimalRow: any = {
                    id: userId,
                    email: signUpData.email,
                    updated_at: new Date().toISOString(),
                };

                try {
                    const { data: minimalUpsert, error: minimalError } = await supabase.from('profiles').upsert(minimalRow).select().maybeSingle();
                    if (minimalError) {
                        console.error('[AuthService] Reduced upsert also failed:', minimalError);
                        return userDocumentToProfile(minimalRow as any);
                    }
                    return userDocumentToProfile((minimalUpsert || minimalRow) as any);
                } catch (e) {
                    console.error('[AuthService] Reduced upsert threw error:', e);
                    return userDocumentToProfile(minimalRow as any);
                }
            }

            throw error;
        }

        // If upsert returned a row use it, otherwise fall back to the local `userRow` we prepared
        return userDocumentToProfile((upsertData || filteredRow || userRow) as any);
    }

    // Fetch column names for a given table from information_schema (with cache)
    private async getTableColumnsCached(tableName: string): Promise<Set<string>> {
        const cached = this.tableColumnsCache.get(tableName);
        if (cached && (Date.now() - cached.fetchedAt) < AuthService.COLUMN_CACHE_TTL_MS) {
            return cached.columns;
        }

        try {
            const { data, error } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', tableName);

            if (error || !data) return new Set<string>();
            const cols = new Set<string>(data.map((r: any) => String(r.column_name)));
            this.tableColumnsCache.set(tableName, { columns: cols, fetchedAt: Date.now() });
            return cols;
        } catch (err) {
            if (__DEV__) console.warn('[AuthService] Could not fetch table columns for', tableName, err);
            return new Set<string>();
        }
    }

    private async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
            if (!data) return null;
            return userDocumentToProfile({
                uid: data.id,
                email: data.email,
                username: data.username || data.email?.split('@')[0] || 'Unknown',
                firstName: data.first_name,
                lastName: data.last_name,
                displayName: data.display_name,
                birthDate: data.birth_date,
                gender: data.gender,
                meritPoints: data.merit_points,
                streakCount: data.current_streak,
                longestStreak: data.longest_streak,
                totalXP: data.total_xp,
                neuralScore: data.neural_score,
                isPremium: data.is_premium,
                subscriptionTier: data.subscription,
                accountStatus: data.account_status,
                emailVerified: data.email_verified,
                verificationStatus: data.verification_status,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
                lastLoginAt: new Date(data.last_login_at),
                lastActivityAt: new Date(data.last_activity_at),
            } as any);
        } catch (err: any) {
            console.error('[AuthService] getUserProfile error for uid:', uid, err);
            throw err;
        }
    }

    private async updateLastLogin(uid: string): Promise<void> {
        const nowIso = new Date().toISOString();
        await supabase.from('profiles').update({ last_login_at: nowIso, last_activity_at: nowIso, updated_at: nowIso }).eq('id', uid);
    }

    private async updateEmailVerificationStatus(
        uid: string,
        verified: boolean
    ): Promise<void> {
        await supabase.from('profiles').update({ email_verified: verified, verification_status: verified ? 'verified' : 'pending', updated_at: new Date().toISOString() }).eq('id', uid);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private calculateAge(birthDate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    private handleAuthError(error: AuthError): AuthResult {
        // Normalize some common server messages (rate limits, network errors)
        const lowerMsg = String(error.message || '').toLowerCase();

        // If server indicates rate limiting, map to a friendly code
        if (lowerMsg.includes('rate') && lowerMsg.includes('limit')) {
            return {
                success: false,
                error: {
                    code: 'rate-limited',
                    message: 'Email rate limit exceeded. Please wait before retrying.',
                    field: 'general',
                },
            };
        }

        const errorMessages: Record<string, any> = {
            'auth/email-already-in-use': {
                code: 'email-already-in-use',
                message: 'This email is already registered. Please login or use a different email.',
                field: 'email',
            },
            'auth/invalid-email': {
                code: 'invalid-email',
                message: 'Please enter a valid email address.',
                field: 'email',
            },
            'auth/weak-password': {
                code: 'weak-password',
                message: 'Password is too weak. Please follow the password requirements.',
                field: 'password',
            },
            'auth/user-not-found': {
                code: 'user-not-found',
                message: 'No account found with this email. Please sign up first.',
                field: 'email',
            },
            'auth/wrong-password': {
                code: 'wrong-password',
                message: 'Incorrect password. Please try again.',
                field: 'password',
            },
            'auth/invalid-credential': {
                code: 'invalid-credential',
                message: 'Invalid email or password. Please check your credentials.',
                field: 'general',
            },
            'auth/too-many-requests': {
                code: 'too-many-requests',
                message: 'Too many failed attempts. Please try again later.',
                field: 'general',
            },
            'auth/network-request-failed': {
                code: 'network-error',
                message: 'Network error. Please check your internet connection.',
                field: 'general',
            },
        };

        const mappedError = errorMessages[error.code] || {
            code: error.code,
            message: error.message || 'An unexpected error occurred. Please try again.',
            field: 'general' as const,
        };

        return {
            success: false,
            error: mappedError,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const authService = AuthService.getInstance();
export default authService;

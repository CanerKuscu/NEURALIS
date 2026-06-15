/**
 * NEURALIS - User Type Definitions
 * Re-exports core types from index.ts and adds auth-specific types.
 */

// Re-export shared types from the canonical source
import type {
    UserProfile,
    VerificationStatus,
    AccountStatus,
    Gender,
    SynapseLinkStatus,
    SynapseLink,
} from './index';

export type {
    UserProfile,
    VerificationStatus,
    AccountStatus,
    Gender,
    SynapseLinkStatus,
    SynapseLink,
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SignUpData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: Gender;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface PasswordValidationResult {
    isValid: boolean;
    errors: PasswordError[];
    strength: PasswordStrength;
}

export type PasswordError =
    | 'TOO_SHORT'
    | 'NO_UPPERCASE'
    | 'NO_LOWERCASE'
    | 'NO_DIGIT'
    | 'NO_SPECIAL_CHAR'
    | 'TOO_COMMON';

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very_strong';

export interface AuthResult {
    success: boolean;
    user?: UserProfile;
    error?: AuthError;
}

export interface AuthError {
    code: string;
    message: string;
    field?: 'email' | 'password' | 'general';
}

// ═══════════════════════════════════════════════════════════════════════════
// FRIEND REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar?: string;
    toUserId: string;
    toUserName: string;
    toUserAvatar?: string;
    status: FriendRequestStatus;
    message?: string;
    createdAt: number | string;
    expiresAt: number | string;
    respondedAt?: number | string;
}








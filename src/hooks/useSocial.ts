/**
 * NEURALIS - Social Hook
 * Strongly typed hook for friend requests and Synapse Link logic
 * Social features powered by Supabase
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import * as db from '../config/db';
import type {
  FriendRequest,
  FriendRequestStatus,
  SynapseLink,
  SynapseLinkStatus,
  UserProfile,
} from '../types/user';
import {
  friendRequestDocToModel,
  synapseLinkDocToModel,
  userDocumentToProfile,
} from '../services/userHelpers';

const {
  db: database,
  doc,
  COLLECTIONS,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  writeBatch,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
} = db as any;

// Helper to get current user ID from Supabase session
async function getCurrentUserIdAsync(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch {
    return null;
  }
}

// Local type aliases for migration compatibility
type DocumentReference = any;
type CollectionReference = any;
type UserDocument = any;
type FriendRequestDocument = any;
type SynapseLinkDocument = any;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UseSocialState {
  isLoading: boolean;
  error: string | null;
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friends: UserProfile[];
  synapseLink: SynapseLink | null;
}

interface UseSocialActions {
  sendFriendRequest: (targetUid: string, message?: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;
  createSynapseLink: (friendUid: string) => Promise<void>;
  dissolveSynapseLink: () => Promise<void>;
  syncLinkedStreak: (friendUid: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

interface UseSocialReturn extends UseSocialState, UseSocialActions {}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const REQUEST_EXPIRY_HOURS = 72; // Friend requests expire after 72 hours

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useSocial(): UseSocialReturn {
  const [state, setState] = useState<UseSocialState>({
    isLoading: true,
    error: null,
    pendingRequests: [],
    sentRequests: [],
    friends: [],
    synapseLink: null,
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize current user ID
  useEffect(() => {
    getCurrentUserIdAsync().then((uid) => setCurrentUserId(uid));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // GET CURRENT USER DATA
  // ─────────────────────────────────────────────────────────────────────────

  const getCurrentUserData = useCallback(async (): Promise<UserDocument | null> => {
    if (!currentUserId) return null;

    const userRef: DocumentReference = doc(db, COLLECTIONS.USERS, currentUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;
    return userSnap.data() as UserDocument;
  }, [currentUserId]);

  // ─────────────────────────────────────────────────────────────────────────
  // SEND FRIEND REQUEST
  // ─────────────────────────────────────────────────────────────────────────

  const sendFriendRequest = useCallback(
    async (targetUid: string, message?: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      if (targetUid === currentUserId) {
        throw new Error('Cannot send friend request to yourself');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Get current user data
        const currentUserData = await getCurrentUserData();
        if (!currentUserData) {
          throw new Error('Current user profile not found');
        }

        // Get target user data
        const targetUserRef: DocumentReference = doc(db, COLLECTIONS.USERS, targetUid);
        const targetUserSnap = await getDoc(targetUserRef);

        if (!targetUserSnap.exists()) {
          throw new Error('Target user not found');
        }

        const targetUserData = targetUserSnap.data() as UserDocument;

        // Check for existing request
        const existingRequestQuery = query(
          collection(db, COLLECTIONS.FRIEND_REQUESTS),
          where('fromUserId', '==', currentUserId),
          where('toUserId', '==', targetUid),
          where('status', '==', 'pending'),
        );
        const existingRequests = await getDocs(existingRequestQuery);

        if (!existingRequests.empty) {
          throw new Error('Friend request already sent');
        }

        // Check if already friends
        const friendsQuery = query(
          collection(db, COLLECTIONS.FRIENDS),
          where('userIds', 'array-contains', currentUserId),
        );
        const friendsSnap = await getDocs(friendsQuery);
        const isAlreadyFriend = friendsSnap.docs.some((doc: any) => {
          const data = doc.data();
          return (data.userIds as string[]).includes(targetUid);
        });

        if (isAlreadyFriend) {
          throw new Error('Already friends with this user');
        }

        // Create friend request
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + REQUEST_EXPIRY_HOURS);

        const requestData: Omit<FriendRequestDocument, 'id'> = {
          fromUserId: currentUserId,
          fromUserName: currentUserData.displayName,
          fromUserAvatar: currentUserData.avatarUrl,
          toUserId: targetUid,
          toUserName: targetUserData.displayName,
          toUserAvatar: targetUserData.avatarUrl,
          status: 'pending',
          message,
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
        };

        const requestsRef: CollectionReference = collection(db, COLLECTIONS.FRIEND_REQUESTS);
        await addDoc(requestsRef, requestData);

        await refreshData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send friend request';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId, getCurrentUserData],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ACCEPT FRIEND REQUEST
  // ─────────────────────────────────────────────────────────────────────────

  const acceptFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const requestRef: DocumentReference = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data() as FriendRequestDocument;

        if (requestData.toUserId !== currentUserId) {
          throw new Error('You can only accept requests sent to you');
        }

        if (requestData.status !== 'pending') {
          throw new Error('This request has already been processed');
        }

        // Use batch for atomic operation
        const batch = writeBatch(db);

        // Update request status
        batch.update(requestRef, {
          status: 'accepted' as FriendRequestStatus,
          respondedAt: serverTimestamp(),
        });

        // Create friendship document
        const friendshipRef = doc(collection(db, COLLECTIONS.FRIENDS));
        batch.set(friendshipRef, {
          userIds: [requestData.fromUserId, requestData.toUserId],
          user1Id: requestData.fromUserId,
          user1Name: requestData.fromUserName,
          user2Id: requestData.toUserId,
          user2Name: requestData.toUserName,
          createdAt: serverTimestamp(),
        });

        await batch.commit();
        await refreshData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to accept friend request';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REJECT FRIEND REQUEST
  // ─────────────────────────────────────────────────────────────────────────

  const rejectFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const requestRef: DocumentReference = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data() as FriendRequestDocument;

        if (requestData.toUserId !== currentUserId) {
          throw new Error('You can only reject requests sent to you');
        }

        await updateDoc(requestRef, {
          status: 'rejected' as FriendRequestStatus,
          respondedAt: serverTimestamp(),
        });

        await refreshData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to reject friend request';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CANCEL FRIEND REQUEST
  // ─────────────────────────────────────────────────────────────────────────

  const cancelFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const requestRef: DocumentReference = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data() as FriendRequestDocument;

        if (requestData.fromUserId !== currentUserId) {
          throw new Error('You can only cancel requests you sent');
        }

        await updateDoc(requestRef, {
          status: 'cancelled' as FriendRequestStatus,
          respondedAt: serverTimestamp(),
        });

        await refreshData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to cancel friend request';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REMOVE FRIEND
  // ─────────────────────────────────────────────────────────────────────────

  const removeFriend = useCallback(
    async (friendUid: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Find friendship document
        const friendsQuery = query(
          collection(db, COLLECTIONS.FRIENDS),
          where('userIds', 'array-contains', currentUserId),
        );
        const friendsSnap = await getDocs(friendsQuery);

        const friendshipDoc = friendsSnap.docs.find((doc: any) => {
          const data = doc.data();
          return (data.userIds as string[]).includes(friendUid);
        });

        if (!friendshipDoc) {
          throw new Error('Friendship not found');
        }

        // Check if there's an active Synapse Link
        if (
          state.synapseLink &&
          (state.synapseLink.userAId === friendUid || state.synapseLink.userBId === friendUid)
        ) {
          // Dissolve Synapse Link first
          await dissolveSynapseLink();
        }

        await deleteDoc(friendshipDoc.ref);
        await refreshData();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove friend';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId, state.synapseLink],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE SYNAPSE LINK
  // ─────────────────────────────────────────────────────────────────────────

  const createSynapseLink = useCallback(
    async (friendUid: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Check if already has a Synapse Link
        if (state.synapseLink && state.synapseLink.status === 'active') {
          throw new Error('You already have an active Synapse Link');
        }

        // Get both users' data
        const currentUserData = await getCurrentUserData();
        if (!currentUserData) {
          throw new Error('Current user profile not found');
        }

        const friendRef: DocumentReference = doc(db, COLLECTIONS.USERS, friendUid);
        const friendSnap = await getDoc(friendRef);

        if (!friendSnap.exists()) {
          throw new Error('Friend not found');
        }

        const friendData = friendSnap.data() as UserDocument;

        // Check if friend already has a Synapse Link
        if (friendData.linkedUserId) {
          throw new Error('Your friend already has an active Synapse Link');
        }

        // Create Synapse Link
        const now = Timestamp.now();
        const synapseLinkData: Omit<SynapseLinkDocument, 'id'> = {
          userAId: currentUserId,
          userAName: currentUserData.displayName,
          userAStreak: currentUserData.streakCount,
          userBId: friendUid,
          userBName: friendData.displayName,
          userBStreak: friendData.streakCount,
          sharedStreak: 0, // Starts fresh
          status: 'active',
          createdAt: now,
          lastSyncAt: now,
        };

        const batch = writeBatch(db);

        // Create Synapse Link document
        const synapseLinkRef = doc(collection(db, COLLECTIONS.SYNAPSE_LINKS));
        batch.set(synapseLinkRef, { ...synapseLinkData, id: synapseLinkRef.id });

        // Update both users
        const currentUserRef: DocumentReference = doc(db, COLLECTIONS.USERS, currentUserId);
        batch.update(currentUserRef, {
          linkedUserId: friendUid,
          linkedUserName: friendData.displayName,
          synapseStreak: 0,
          updatedAt: serverTimestamp(),
        });

        batch.update(friendRef, {
          linkedUserId: currentUserId,
          linkedUserName: currentUserData.displayName,
          synapseStreak: 0,
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
        await refreshData();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create Synapse Link';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId, state.synapseLink, getCurrentUserData],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DISSOLVE SYNAPSE LINK
  // ─────────────────────────────────────────────────────────────────────────

  const dissolveSynapseLink = useCallback(async (): Promise<void> => {
    if (!currentUserId) {
      throw new Error('User must be authenticated');
    }

    if (!state.synapseLink) {
      throw new Error('No active Synapse Link');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const batch = writeBatch(db);

      // Update Synapse Link status
      const synapseLinkRef: DocumentReference = doc(
        db,
        COLLECTIONS.SYNAPSE_LINKS,
        state.synapseLink.id,
      );
      batch.update(synapseLinkRef, {
        status: 'dissolved' as SynapseLinkStatus,
        brokenBy: currentUserId,
        brokenAt: serverTimestamp(),
        breakReason: 'manual_dissolve',
      });

      // Clear linked user from both users
      const partnerUid =
        state.synapseLink.userAId === currentUserId
          ? state.synapseLink.userBId
          : state.synapseLink.userAId;

      const currentUserRef: DocumentReference = doc(db, COLLECTIONS.USERS, currentUserId);
      batch.update(currentUserRef, {
        linkedUserId: null,
        linkedUserName: null,
        synapseStreak: null,
        updatedAt: serverTimestamp(),
      });

      const partnerRef: DocumentReference = doc(db, COLLECTIONS.USERS, partnerUid);
      batch.update(partnerRef, {
        linkedUserId: null,
        linkedUserName: null,
        synapseStreak: null,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      await refreshData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to dissolve Synapse Link';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [currentUserId, state.synapseLink]);

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC LINKED STREAK
  // ─────────────────────────────────────────────────────────────────────────

  const syncLinkedStreak = useCallback(
    async (friendUid: string): Promise<void> => {
      if (!currentUserId) {
        throw new Error('User must be authenticated');
      }

      if (!state.synapseLink || state.synapseLink.status !== 'active') {
        throw new Error('No active Synapse Link');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Get both users' current streaks
        const currentUserData = await getCurrentUserData();
        if (!currentUserData) {
          throw new Error('Current user profile not found');
        }

        const friendRef: DocumentReference = doc(db, COLLECTIONS.USERS, friendUid);
        const friendSnap = await getDoc(friendRef);

        if (!friendSnap.exists()) {
          throw new Error('Friend not found');
        }

        const friendData = friendSnap.data() as UserDocument;

        // Calculate shared streak (minimum of both)
        // Both must have completed today for streak to increase
        const newSharedStreak = Math.min(currentUserData.streakCount, friendData.streakCount);

        const batch = writeBatch(db);

        // Update Synapse Link
        const synapseLinkRef: DocumentReference = doc(
          db,
          COLLECTIONS.SYNAPSE_LINKS,
          state.synapseLink.id,
        );
        batch.update(synapseLinkRef, {
          userAStreak:
            state.synapseLink.userAId === currentUserId
              ? currentUserData.streakCount
              : friendData.streakCount,
          userBStreak:
            state.synapseLink.userBId === currentUserId
              ? currentUserData.streakCount
              : friendData.streakCount,
          sharedStreak: newSharedStreak,
          lastSyncAt: serverTimestamp(),
        });

        // Update both users' synapse streak
        const currentUserRef: DocumentReference = doc(db, COLLECTIONS.USERS, currentUserId);
        batch.update(currentUserRef, {
          synapseStreak: newSharedStreak,
          updatedAt: serverTimestamp(),
        });

        batch.update(friendRef, {
          synapseStreak: newSharedStreak,
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
        await refreshData();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync streaks';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [currentUserId, state.synapseLink, getCurrentUserData],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REFRESH DATA
  // ─────────────────────────────────────────────────────────────────────────

  const refreshData = useCallback(async (): Promise<void> => {
    if (!currentUserId) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch pending requests (to me)
      const pendingQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
      );
      const pendingSnap = await getDocs(pendingQuery);
      const pendingRequests = pendingSnap.docs.map((doc: any) =>
        friendRequestDocToModel({ id: doc.id, ...doc.data() } as FriendRequestDocument),
      );

      // Fetch sent requests (from me)
      const sentQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where('fromUserId', '==', currentUserId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
      );
      const sentSnap = await getDocs(sentQuery);
      const sentRequests = sentSnap.docs.map((doc: any) =>
        friendRequestDocToModel({ id: doc.id, ...doc.data() } as FriendRequestDocument),
      );

      // Fetch friends
      const friendsQuery = query(
        collection(db, COLLECTIONS.FRIENDS),
        where('userIds', 'array-contains', currentUserId),
      );
      const friendsSnap = await getDocs(friendsQuery);

      const friendIds: string[] = [];
      friendsSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        const userIds = data.userIds as string[];
        const friendId = userIds.find((id) => id !== currentUserId);
        if (friendId) friendIds.push(friendId);
      });

      // Fetch friend profiles
      const friends: UserProfile[] = [];
      for (const friendId of friendIds) {
        const friendRef: DocumentReference = doc(db, COLLECTIONS.USERS, friendId);
        const friendSnap = await getDoc(friendRef);
        if (friendSnap.exists()) {
          friends.push(userDocumentToProfile(friendSnap.data() as UserDocument));
        }
      }

      // Fetch Synapse Link
      let synapseLink: SynapseLink | null = null;
      const synapseLinkQuery = query(
        collection(db, COLLECTIONS.SYNAPSE_LINKS),
        where('status', '==', 'active'),
      );
      const synapseLinkSnap = await getDocs(synapseLinkQuery);

      synapseLinkSnap.docs.forEach((doc: any) => {
        const data = doc.data() as SynapseLinkDocument;
        if (data.userAId === currentUserId || data.userBId === currentUserId) {
          synapseLink = synapseLinkDocToModel({ ...data, id: doc.id });
        }
      });

      setState({
        isLoading: false,
        error: null,
        pendingRequests,
        sentRequests,
        friends,
        synapseLink,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load social data';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [currentUserId]);

  // ─────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    ...state,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    createSynapseLink,
    dissolveSynapseLink,
    syncLinkedStreak,
    refreshData,
  };
}

export default useSocial;

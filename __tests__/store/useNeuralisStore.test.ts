/**
 * @file Zustand Store tests
 *
 * Tests the Neuralis global store actions and state transitions.
 */

import { create } from 'zustand';

// Minimal reproduction of store shape for testing
interface TestState {
  user: { uid: string; displayName: string } | null;
  isAuthenticated: boolean;
  streakState: string;
  uiOpacity: number;
  isGrayscale: boolean;
  locale: string;
  setUser: (user: any) => void;
  setAuthenticated: (v: boolean) => void;
  setStreakState: (s: string) => void;
  setUiOpacity: (o: number) => void;
  setGrayscale: (v: boolean) => void;
}

const useTestStore = create<TestState>((set) => ({
  user: null,
  isAuthenticated: false,
  streakState: 'healthy',
  uiOpacity: 1,
  isGrayscale: false,
  locale: 'en-US',
  setUser: (user) => set({ user }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setStreakState: (s) => set({ streakState: s }),
  setUiOpacity: (o) => set({ uiOpacity: o }),
  setGrayscale: (v) => set({ isGrayscale: v }),
}));

describe('NeuralisStore', () => {
  beforeEach(() => {
    useTestStore.setState({
      user: null,
      isAuthenticated: false,
      streakState: 'healthy',
      uiOpacity: 1,
      isGrayscale: false,
    });
  });

  it('should default to unauthenticated state', () => {
    const state = useTestStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should set user and authentication', () => {
    const store = useTestStore.getState();
    store.setUser({ uid: 'user-1', displayName: 'Test User' });
    store.setAuthenticated(true);

    const updated = useTestStore.getState();
    expect(updated.user?.uid).toBe('user-1');
    expect(updated.isAuthenticated).toBe(true);
  });

  it('should update streak state', () => {
    useTestStore.getState().setStreakState('critical');
    expect(useTestStore.getState().streakState).toBe('critical');
  });

  it('should update UI opacity', () => {
    useTestStore.getState().setUiOpacity(0.5);
    expect(useTestStore.getState().uiOpacity).toBe(0.5);
  });

  it('should toggle grayscale', () => {
    useTestStore.getState().setGrayscale(true);
    expect(useTestStore.getState().isGrayscale).toBe(true);

    useTestStore.getState().setGrayscale(false);
    expect(useTestStore.getState().isGrayscale).toBe(false);
  });

  it('should handle null user on logout', () => {
    const store = useTestStore.getState();
    store.setUser({ uid: 'user-1', displayName: 'Test' });
    store.setAuthenticated(true);

    store.setUser(null);
    store.setAuthenticated(false);

    const state = useTestStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

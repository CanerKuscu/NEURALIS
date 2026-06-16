/**
 * NEURALIS - Shared Tick Service
 * Consolidates multiple 1-second setInterval instances into a single timer.
 *
 * Problem: 4 hooks each create their own 1-second interval (useNeuralisCore,
 * useNeuralDecay, AudioDecayHook, useDynamicVisualWidget), causing 4 concurrent
 * timers firing every second — unnecessary CPU/battery drain.
 *
 * Solution: Single shared interval that auto-starts when first listener subscribes
 * and auto-stops when last listener unsubscribes.
 */

type TickCallback = () => void;

class TickService {
  private interval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<TickCallback> = new Set();

  /**
   * Subscribe to 1-second ticks. Returns an unsubscribe function.
   * The shared interval starts automatically on first subscriber
   * and stops when no subscribers remain.
   */
  subscribe(callback: TickCallback): () => void {
    this.listeners.add(callback);

    if (this.listeners.size === 1) {
      this.start();
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.listeners.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          if (__DEV__) {
            console.warn('[TickService] Listener error:', e);
          }
        }
      });
    }, 1000);
  }

  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Number of active subscribers (for debugging) */
  get subscriberCount(): number {
    return this.listeners.size;
  }
}

export const tickService = new TickService();

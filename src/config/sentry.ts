/**
 * Sentry Configuration for Neuralis
 *
 * Initializes Sentry for crash reporting and error tracking.
 * Call `initSentry()` in the app root before any other code.
 *
 * @module config/sentry
 *
 * @example
 * ```tsx
 * // In App.tsx or app/_layout.tsx
 * import { initSentry } from './src/config/sentry';
 * initSentry();
 * ```
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/** Sentry DSN — must be provided via EXPO_PUBLIC_SENTRY_DSN env variable */
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

/**
 * Initialize Sentry error tracking.
 *
 * Features enabled:
 * - Automatic crash detection
 * - Performance monitoring (20% sample rate)
 * - User session tracking
 * - Breadcrumbs for navigation and network
 * - Release/environment tagging
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] No DSN configured — skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: Constants.expoConfig?.extra?.eas?.projectId
      ? process.env.EXPO_PUBLIC_APP_ENV || 'development'
      : 'development',
    release: `neuralis@${Constants.expoConfig?.version || '1.0.0'}`,

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Don't send events in dev mode
    enabled: !__DEV__,

    // Breadcrumbs
    enableNativeCrashHandling: true,

    // Integrations
    integrations: [Sentry.reactNativeTracingIntegration()],

    // Filter out non-critical errors
    beforeSend(event) {
      // Skip network timeout errors
      if (event.exception?.values?.some((e) => e.value?.includes('Network request failed'))) {
        return null;
      }
      return event;
    },
  });
}

/**
 * Capture a handled error with context.
 *
 * @param error - The error object to report
 * @param context - Additional context (tags, extras) to attach
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extras?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  },
): void {
  if (!SENTRY_DSN) {
    console.error('[Sentry] Error captured (not sent — no DSN):', error.message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set the authenticated user for Sentry context.
 *
 * @param user - User info, or null to clear
 */
export function setSentryUser(
  user: { id: string; email?: string; username?: string } | null,
): void {
  if (!SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb for manual navigation or event tracking.
 *
 * @param category - Category (e.g., 'navigation', 'user', 'api')
 * @param message - Description of the breadcrumb
 * @param data - Optional additional data
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

export { Sentry };

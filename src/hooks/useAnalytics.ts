/**
 * useAnalytics - Hook for tracking user events and screen views.
 *
 * Combines local AnalyticsService tracking with Sentry breadcrumbs
 * for a unified analytics pipeline.
 *
 * @example
 * ```tsx
 * const { trackEvent, trackScreenView } = useAnalytics();
 *
 * useEffect(() => {
 *   trackScreenView('HomeScreen');
 * }, []);
 *
 * const handleLessonComplete = () => {
 *   trackEvent('lesson_completed', { category: 'math', xp: 50 });
 * };
 * ```
 */

import { useCallback } from 'react';
import { addBreadcrumb } from '../config/sentry';

type EventData = Record<string, string | number | boolean | undefined>;

/**
 * Analytics tracking hook.
 *
 * @returns Object with `trackEvent` and `trackScreenView` functions
 */
export function useAnalytics() {
    /**
     * Track a custom event.
     *
     * @param eventName - Name of the event (e.g., 'lesson_completed')
     * @param data - Additional event data
     */
    const trackEvent = useCallback((eventName: string, data?: EventData) => {
        // Sentry breadcrumb for error context
        addBreadcrumb('user_event', eventName, data as Record<string, unknown>);

        // Local logging in dev
        if (__DEV__) {
            console.log(`[Analytics] Event: ${eventName}`, data);
        }

        // Future: Add Firebase Analytics, Amplitude, etc.
        // analytics().logEvent(eventName, data);
    }, []);

    /**
     * Track a screen view.
     *
     * @param screenName - Name of the screen being viewed
     */
    const trackScreenView = useCallback((screenName: string) => {
        addBreadcrumb('navigation', `Viewed ${screenName}`);

        if (__DEV__) {
            console.log(`[Analytics] Screen: ${screenName}`);
        }

        // Future: analytics().logScreenView({ screen_name: screenName });
    }, []);

    return { trackEvent, trackScreenView };
}

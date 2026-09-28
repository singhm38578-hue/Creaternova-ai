/**
 * CreatorNova Privacy-Conscious Analytics
 * Tracks high-level product lifecycle events without storing sensitive prompt, script, or user PII.
 */

export type AnalyticsEventName =
  | 'landing_view'
  | 'start_free_clicked'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_project_created';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = 'creatornova_analytics_events';

export const analytics = {
  track: (name: AnalyticsEventName, metadata?: Record<string, string | number | boolean>): AnalyticsEvent => {
    // Privacy Safeguard: strip any accidental content or user secrets
    const safeMeta: Record<string, string | number | boolean> = {};
    if (metadata) {
      for (const [key, val] of Object.entries(metadata)) {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('prompt') &&
          !lowerKey.includes('script') &&
          !lowerKey.includes('topic') &&
          !lowerKey.includes('email') &&
          !lowerKey.includes('pass') &&
          !lowerKey.includes('token') &&
          !lowerKey.includes('secret')
        ) {
          safeMeta[key] = val;
        }
      }
    }

    const event: AnalyticsEvent = {
      name,
      timestamp: new Date().toISOString(),
      metadata: Object.keys(safeMeta).length > 0 ? safeMeta : undefined,
    };

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
        existing.push(event);
        // Retain last 50 events for debugging and verification
        if (existing.length > 50) existing.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

        // Dispatch window event
        window.dispatchEvent(new CustomEvent('creatornova:analytics', { detail: event }));
      } catch (e) {
        // Non-blocking
      }
    }

    return event;
  },

  getRecentEvents: (): AnalyticsEvent[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  hasEvent: (name: AnalyticsEventName): boolean => {
    const events = analytics.getRecentEvents();
    return events.some((e) => e.name === name);
  },
};

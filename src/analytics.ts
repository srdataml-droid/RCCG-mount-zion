import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost || 'https://us.i.posthog.com',
    capture_pageview: false,
  });
  posthog.capture('$pageview');
}

export function trackEvent(event: string) {
  if (posthogKey) posthog.capture(event);
}

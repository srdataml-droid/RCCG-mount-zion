type PostHog = typeof import('posthog-js').default;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

// PostHog is loaded on demand rather than imported at the top of the bundle.
// It is a large library, it is optional, and nothing on the page waits for
// it — so it should not delay the church site rendering for a visitor.
let client: PostHog | null = null;
const pending: string[] = [];

if (posthogKey) {
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: posthogHost || 'https://us.i.posthog.com',
      capture_pageview: false,
    });
    client = posthog;
    posthog.capture('$pageview');
    pending.splice(0).forEach(event => posthog.capture(event));
  });
}

export function trackEvent(event: string) {
  if (!posthogKey) return;
  // Anything captured before the library finishes loading is held here, so a
  // fast click on Give or Watch is still recorded.
  if (client) client.capture(event);
  else pending.push(event);
}

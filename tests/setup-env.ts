// Deterministic fake configuration for unit tests. `lib/env.ts` parses process.env on import,
// so these must be set before any module under test loads.
Object.assign(process.env, {
  BASE_URL: 'https://localhost:3000',
  REDDIT_CLIENT_ID: 'test-client-id',
  REDDIT_CLIENT_SECRET: 'test-client-secret',
  REDDIT_REDIRECT_URI: 'https://localhost:3000/api/auth/callback/reddit',
  SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars',
  USER_AGENT: 'web-app:reddit-viewer:test (by u/test)',
  REDDIT_API_BASE: 'https://oauth.reddit.test',
  REDDIT_WWW_BASE: 'https://www.reddit.test',
})

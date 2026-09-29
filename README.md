# Reddit Viewer

A fast, server-first Reddit client built on Next.js (canary during development) and React 19. It signs in with Reddit's official OAuth. The browser never talks to Reddit's API: every read and write happens on the server, through Server Components and Server Actions.

- **Feeds:** home, popular, subreddits, multireddits, user profiles, saved posts, search.
- **Actions:** vote, save, comment, reply, edit and delete, subscribe to communities and follow users, and create and edit multireddits. All of them are optimistic, with rollback.
- **Media:** images, galleries with a lightbox, GIF loops, Reddit video with sound (HLS), and click-to-load embeds (YouTube, Vimeo, Streamable, Twitch, Redgifs, Giphy, Imgur, TikTok, Spotify, SoundCloud, and more), plus inline images and GIFs in comments.
- **Settings:** light, dark, or system theme, and "Blur NSFW media". Both are stored in cookies.

The design is in [`docs/design.md`](docs/design.md), and the phase-by-phase build plan and status are in [`docs/implementation.md`](docs/implementation.md).

## Setup

Requirements: Node 24 and npm.

1. **Create a Reddit app** at <https://www.reddit.com/prefs/apps>:
   - Type: **web app**.
   - Redirect URI: `https://localhost:3000/api/auth/callback/reddit`.
2. **Configure the environment:**

   ```sh
   cp .env.example .env.local
   ```

   Fill in the client id and secret, a `USER_AGENT` such as `web:reddit-viewer:0.1.0 (by /u/yourname)`, and two secrets:

   ```sh
   openssl rand -base64 48   # SESSION_SECRET (32+ characters)
   openssl rand -base64 32   # NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
   ```

   `.env.local` is git-ignored. Never commit it.

3. **Install and run:**

   ```sh
   npm install
   npm run dev
   ```

   The dev server runs over **HTTPS** (`next dev --experimental-https`), because Reddit requires a secure redirect URI and the session cookies are `Secure`. Open <https://localhost:3000> and accept the local certificate.

## Scripts

| Command                       | What it does                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Dev server on https://localhost:3000                                                                 |
| `npm run build` / `npm start` | Production build and server                                                                          |
| `npm run check`               | CSS module types, `tsc`, ESLint and Stylelint, then unit tests with coverage                         |
| `npm test`                    | Vitest with coverage; fails below 90% branches, functions, lines, or statements                      |
| `npm run test:e2e`            | Playwright: builds the app and runs it against a mock Reddit (no credentials needed)                 |
| `npm run format`              | Prettier                                                                                             |
| `npm run types:generate`      | Regenerates `lib/reddit/schemas/generated.ts` from the committed samples in `fixtures/reddit/things` |
| `npm run media:corpus`        | Rebuilds `tests/media/corpus` from local raw captures                                                |

Before running e2e for the first time, install the browser with `npx playwright install chromium`.

## Fixtures and types

Types come from real Reddit JSON:

1. Sign in on the dev server, then visit <https://localhost:3000/api/dev/capture>. It captures a scrubbed set of listings, threads, and account data into `fixtures/reddit/raw/`. This is local only and git-ignored. The route returns 404 outside `next dev`.
2. `npm run types:generate` extracts per-kind samples into `fixtures/reddit/things/` (committed), then generates Zod schemas with quicktype.

Curated schemas in `lib/reddit/schemas` sit on top of the generated ones.

## Testing and CI

- **Unit tests** (Vitest, in `tests/unit`) render Server Components to HTML with `prerender`, and test client islands in happy-dom.
- **End-to-end tests** (Playwright, in `e2e/`) run against `e2e/mock-reddit/server.ts`. It is an in-memory Reddit that records writes and can inject latency and failures, so the optimistic-update and rollback paths are tested for real.
- **GitHub Actions:**
  - `ci.yml` runs the checks and e2e on every push and PR.
  - `canary.yml` tries the newest `next@canary` weekly, and opens a PR when everything passes.

## Security

- OAuth tokens live only in sealed, httpOnly cookies. `proxy.ts` refreshes them.
- All Reddit HTML is sanitized before it renders.
- Every response carries a static Content Security Policy and the standard hardening headers, from `lib/security/headers.ts`. The policy has no nonces, which keeps Partial Prerendering working.

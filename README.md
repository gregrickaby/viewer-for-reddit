# Viewer for Reddit

Surf Reddit without ads or algorithms: **<https://reddit-viewer.com>**

Viewer for Reddit is a Reddit client built on Next.js and React Server Components. It signs in with Reddit’s official OAuth. The browser never calls Reddit’s API: the server makes every read and write, through Server Components and Server Actions, and sends pages already rendered.

- **Feeds:** home, popular, subreddits, multireddits, user profiles, saved posts, search.
- **Actions:** vote, save, comment, reply, edit and delete, subscribe to communities and follow users, and create and edit multireddits. Each one updates the page at once and rolls back if Reddit refuses.
- **Media:** images, galleries with a lightbox, GIF loops, Reddit video with sound (HLS), and click-to-load embeds (YouTube, Vimeo, Streamable, Twitch, Redgifs, Giphy, Imgur, TikTok, Spotify, SoundCloud), plus inline images and GIFs in comments.
- **Live:** a thread sorted by New polls for new comments and for edits to the post, such as a score, every 15 seconds. Reddit live threads (`/live/…`) show updates as they are posted, and `/active` lists the busiest game, match, and daily threads. The server does the polling through Server Actions, so the browser still never calls Reddit, and public threads are cached for 10 seconds to stay inside Reddit's shared request limit.
- **Settings:** light, dark, or system theme, and "Blur NSFW media". Both are stored in cookies.

Version 10 is a ground-up rewrite. Version 9 and earlier (built with Mantine) are in the [`9.1.0` tag](https://github.com/gregrickaby/viewer-for-reddit/tree/9.1.0).

## Setup

Requirements: Node 24 and npm.

1. **Create a Reddit app** at <https://www.reddit.com/prefs/apps>:
   - Type: **web app**.
   - Redirect URI: `https://localhost:3000/api/auth/callback/reddit`.
2. **Configure the environment:**

   ```sh
   cp .env.example .env.local
   ```

   Fill in the client id and secret, a `USER_AGENT` such as `web:viewer-for-reddit:10.0.0 (by /u/yourname)`, and two secrets:

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
- **End-to-end tests** (Playwright, in `e2e/`) run against `e2e/mock-reddit/server.ts`. It is an in-memory Reddit that records writes and can inject latency and failures. The tests use it to check optimistic updates and their rollback.
- **GitHub Actions:** `ci.yml` runs the checks and e2e on every push and PR.

## Security

- OAuth tokens live only in sealed, httpOnly cookies. `proxy.ts` refreshes them.
- All Reddit HTML is sanitized before it renders.
- Every response carries a static Content Security Policy plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and (over HTTPS) `Strict-Transport-Security`, all set in `lib/security/headers.ts`.
- The policy has no nonces. A nonce needs every page rendered per request, and Partial Prerendering serves a prerendered shell.

## Support

- Report bugs and request features in [GitHub Issues](https://github.com/gregrickaby/viewer-for-reddit/issues).
- Support the project: [Buy Me a Coffee](https://buymeacoffee.com/gregrickaby), [Venmo](https://venmo.com/u/GregRickaby), [PayPal](https://www.paypal.com/paypalme/GregRickaby).

## License

MIT © [Greg Rickaby](https://gregrickaby.com). See [LICENSE](LICENSE).

---

_Viewer for Reddit is an independent project not affiliated with Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc. See Reddit’s [brand guidelines](https://redditinc.com/brand), [API terms](https://redditinc.com/policies/data-api-terms), and [API documentation](https://www.reddit.com/dev/api/)._

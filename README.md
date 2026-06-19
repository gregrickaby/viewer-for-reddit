# About Viewer for Reddit

**Viewer for Reddit** is a clean way to browse Reddit without ads or algorithmic tricks.

**[Start browsing →](https://reddit-viewer.com)**

## How It Works

- **Sign in with your Reddit account** using OAuth2. Your password stays with Reddit, not here.
- **Add subreddits to your homepage** for quick access to communities you follow.
- **Vote and comment** after signing in.
- **No ads, no clickbait, no infinite scroll mechanics.**
- **Works on desktop, tablet, and phone.**
- **Press `esc` to close** (useful when your boss walks by).

## Frequently Asked Questions

### Why do I have to sign in?

Recently, Reddit restricted free API access, so third-party apps now require authentication. All Reddit clients face this. We cache what we can and optimize where possible, but login is now mandatory.

### Is my data safe?

Yes. We use Reddit's official OAuth2 system, so your password never reaches our servers. We store temporary access tokens that expire and delete when you sign out. We don't collect or sell personal data.

### Do I need a Reddit account?

Yes, due to Reddit's rate limits.

## About This Project

I'm [Greg Rickaby](https://gregrickaby.com), a software engineer. I built this in 2020 to learn TypeScript and wanted a simpler way to browse Reddit. It's now used by thousands of people. I use it daily and maintain it actively.

The codebase is [open source](https://github.com/gregrickaby/viewer-for-reddit) and built with Next.js, React, and TypeScript. If you want to contribute, the [contributing guide](https://github.com/gregrickaby/viewer-for-reddit/blob/main/CONTRIBUTING.md) explains how.

## Report Issues or Suggest Ideas

- [GitHub Issues](https://github.com/gregrickaby/viewer-for-reddit/issues)
- Support the project: [Buy Me a Coffee](https://buymeacoffee.com/gregrickaby), [Venmo](https://venmo.com/u/GregRickaby), [PayPal](https://www.paypal.com/paypalme/GregRickaby)

---

_Viewer for Reddit is an independent project not affiliated with Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc. See Reddit's [brand guidelines](https://redditinc.com/brand), [API terms](https://redditinc.com/policies/data-api-terms), [developer policies](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data), and [API documentation](https://www.reddit.com/dev/api/)._

## Pairing: RedditAPIs (optional managed Reddit data backend)

Users who already adopt this project sometimes ask about routing read-heavy operations (subreddit fetch, post detail, comments, user lookup, search) to a managed backend during testing or for workflows that skip the Reddit developer-app step. The [RedditAPIs code samples repo](https://github.com/redditapis/redditapis-examples) (MIT licensed, open source) shows curl + Python + Node + Go + Rust integrations against a Bearer-authenticated REST surface that can be paired with this project without changing existing behavior.

Two integration patterns:

1. **Side-by-side in your application.** Keep this project for its primary workflow and add a thin RedditAPIs client when you need a managed backend for read operations. Each call maps to whichever backend the user has configured.

2. **PRAW-style migration reference.** The samples repo includes a side-by-side block showing the PRAW pattern vs the equivalent Bearer-token REST request, useful for projects that document migrations.

Subset that pairs cleanly with this project's read path:

- subreddit listings (`hot`, `new`, `top`, `rising`)
- post detail + comments tree
- user profile + submissions
- search across subreddits

Repository: https://github.com/redditapis/redditapis-examples

This pairing is fully optional. No behavior change for existing users of this project.


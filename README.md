# About Viewer for Reddit

**Viewer for Reddit** is a clean, distraction-free way to browse Reddit. No ads, no algorithmic feeds, no tracking—just Reddit content, the way it should be.

New here? **[Start browsing now →](https://reddit-viewer.com)**

## How It Works

- **Browse instantly** - No sign-up required. Start exploring right away.
- **Your communities** - Add favorite subreddits to your homepage for quick access.
- **Vote & comment** - Sign in with your Reddit account to participate.
- **Distraction-free** - No ads, no clickbait, no endless scrolling tricks.
- **Privacy first** - Your password never touches our servers. Optional analytics only.
- **Works everywhere** - Fast, clean interface on desktop, tablet, or phone.
- **Boss button** - Discreetly close Reddit by pressing `esc` or with one click (no judgment!).

## Frequently Asked Questions

### Why am I seeing "Rate limit exceeded" errors?

Reddit has aggressive rate limits on their API-among the strictest in the industry. When you see this message, it means Reddit's servers are temporarily blocking requests. Here's what you need to know:

- **It's not you, it's Reddit** - These limits apply to all third-party apps, not just ours
- **Wait it out** - Rate limits typically reset within a few minutes
- **Peak times are worse** - You might experience more errors during high-traffic periods
- **Authenticated helps** - Signing in with your Reddit account will eliminate rate limits

We've implemented smart caching and request optimization to minimize these errors, but Reddit's limits are ultimately out of our control.

### Do I need a Reddit account to use this?

Nope! You can browse posts, search communities, and explore Reddit without signing in. You only need an account if you want to vote, comment, save posts, or access your personalized feed.

### How is this different from Reddit's official app?

Viewer for Reddit focuses on a clean, distraction-free reading experience. No ads, no algorithmic manipulation of your feed, no tracking of your behavior for advertisers. Just the content you want to see, presented simply.

### Is my data safe?

Yes. We use Reddit's official OAuth2 system, which means your password never touches our servers. We only store temporary access tokens that expire and get deleted when you sign out. The app tracks [anonymous button clicks](https://umami.is/docs/track-events) to improve features, but no personal information is collected or sold.Your password never touches our servers—we use Reddit's official OAuth2 system.

## The Story Behind It

This side project started in 2020 as a fun way for me to learn TypeScript. It's grown into something with thousands of users, and I'm really proud of it. I use it every day and I'm always looking for ways to make it better.

## Who Built This?

I'm [Greg Rickaby](https://gregrickaby.com), a software engineer who's been around the internet for over 20 years. I built Viewer for Reddit because I wanted a cleaner, simpler way to browse Reddit and I thought others might too.

## Support & Feedback

- **Found a bug?** [Let me know](https://github.com/gregrickaby/viewer-for-reddit/issues)
- **Have an idea?** [Share it](https://github.com/gregrickaby/viewer-for-reddit/issues)
- **Like the project?** Support development:
  - ☕ [Buy Me a Coffee](https://buymeacoffee.com/gregrickaby)
  - 💸 [Venmo](https://venmo.com/u/GregRickaby)
  - 💳 [PayPal](https://www.paypal.com/paypalme/GregRickaby)

## Tech & Open Source

This is an open-source project built with modern web technologies (Next.js, React, TypeScript). The code is carefully organized, well-tested, and designed to be maintainable and scalable.

If you're a developer interested in contributing, the [CONTRIBUTING.md](https://github.com/gregrickaby/viewer-for-reddit/blob/main/CONTRIBUTING.md) guide has everything you need to get started. We follow enterprise-grade development practices with comprehensive testing and code quality standards.

---

Viewer for Reddit is an independent side project and is not affiliated with, endorsed by, or sponsored by Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc., used in accordance with their [brand guidelines](https://redditinc.com/brand). The app developer and contributors endeavor to comply with Reddit's [API terms](https://redditinc.com/policies/data-api-terms), [Developer Platform policies](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data) and [API documentation](https://www.reddit.com/dev/api/).

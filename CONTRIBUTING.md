# Contributing Guide <!-- omit in toc -->

Welcome! 👋 This guide will help you contribute to Viewer for Reddit, whether you're fixing a bug, adding a feature, or generating types from the Reddit API.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development](#development)
  - [Quality Gates](#quality-gates)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [File Structure](#file-structure)
  - [NPM Scripts Reference](#npm-scripts-reference)
- [Reddit API Integration](#reddit-api-integration)
  - [Authentication Setup](#authentication-setup)
  - [Type Generation System](#type-generation-system)
- [Advanced Topics](#advanced-topics)
  - [Codegen Architecture Deep Dive](#codegen-architecture-deep-dive)
- [Getting Help](#getting-help)
  - [Resources](#resources)
  - [Before You Ask](#before-you-ask)
  - [Reporting Issues](#reporting-issues)
- [Legal](#legal)

---

## Quick Start

**New to the project?** Start here! ⚡

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment**: `cp .env.example .env` and add your Reddit API credentials
4. **Start development**: `npm run dev`
5. **Open**: <http://localhost:3000>

That's it! You're ready to start contributing. 🎉

---

## Development Workflow

### Prerequisites

- **Node.js v22** (see `.nvmrc`)
- **npm v10+**
- **Git**
- **Reddit API credentials**

### Setup

```bash
# Clone your fork
git clone https://github.com/gregrickaby/viewer-for-reddit.git
cd viewer-for-reddit

# Install dependencies
nvm use && npm install

# Copy environment template
cp .env.example .env
```

**Reddit API Setup**:

- Visit <https://www.reddit.com/prefs/apps>
- Create a new app (type: `personal use script`)
- Add your credentials to `.env`:

```bash
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
```

**Analytics Setup** (Optional):

For tracking website analytics, add these optional environment variables:

```bash
ENABLE_ANALYTICS="true"
ANALYTICS_SCRIPT_URL="https://your-analytics-provider.com/script.js"
ANALYTICS_ID="your-analytics-site-id"
```

> **Note**: Analytics are only loaded in production when `ENABLE_ANALYTICS` is not `"false"`

> **Note**: The app will not work without Reddit credentials!

### Development

```bash
# Start development server
npm run dev

# View at http://localhost:3000
# Features: Hot reload, Turbo mode, automatic cache clearing
```

### Quality Gates

**Required for all code changes:**

```bash
npm run format      # Prettier formatting
npm run lint        # ESLint with Mantine config
npm run typecheck   # TypeScript strict checking
npm run test        # Vitest unit tests
npm run coverage    # Test coverage (aim for 90%+)
```

**For production:**

```bash
npm run build       # Production build
npm run start       # Test production build locally
```

---

## Project Architecture

### Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI**: Mantine v8 component library
- **Styling**: CSS Modules
- **State**: Redux Toolkit w/ RTK Query
- **Types**: TypeScript (strict mode)
- **Testing**: Vitest + React Testing Library + MSW v2
- **API**: Reddit REST API + OAuth 2.0

### API Architecture

The app uses a **dual-mode API architecture** to separate anonymous and authenticated Reddit requests:

#### Anonymous Mode (Read-Only)

For public Reddit content that doesn't require user authentication:

- **Route**: `/api/reddit`
- **Authentication**: App-level tokens (`client_credentials` flow)
- **Token Source**: `getRedditToken()` server action
- **Use Cases**:
  - Subreddit posts (`/r/{subreddit}`)
  - Post comments
  - User profiles
  - Search results
  - Trending/popular content

**Example:**

```typescript
// In RTK Query service
const postsApi = createApi({
  baseQuery: createRedditBaseQuery('/api/reddit'), // Anonymous
  endpoints: (builder) => ({
    getSubredditPosts: builder.query({
      query: (subreddit) => `/r/${subreddit}/hot.json`
    })
  })
})
```

#### Authenticated Mode (Interactive)

For user-specific content requiring authentication:

- **Route**: `/api/reddit/me` (follows REST `/me` convention)
- **Authentication**: User session tokens (`authorization_code` flow)
- **Token Source**: `getSession()` from encrypted cookie
- **Use Cases**:
  - User custom feeds
  - User subscriptions
  - Home feed
  - Voting (future)
  - Saved posts (future)

**Example:**

```typescript
// In RTK Query service
const authenticatedApi = createApi({
  baseQuery: createRedditBaseQuery('/api/reddit/me'), // Authenticated
  endpoints: (builder) => ({
    getUserCustomFeeds: builder.query({
      query: () => '/api/multi/user/{username}'
    })
  })
})
```

#### Key Design Principles

1. **Clean Separation**: No query overlap between anonymous and authenticated APIs
2. **Credential Security**: App tokens never mixed with user tokens
3. **Type Safety**: All services use autogenerated types from OpenAPI spec
4. **Graceful Degradation**: Authenticated endpoints return empty data when not logged in
5. **Factory Pattern**: Base queries created via `createRedditBaseQuery()` factory

#### Request Flow

```text
Component
    ↓
RTK Query Hook (useGetSubredditPostsQuery)
    ↓
Base Query (createRedditBaseQuery)
    ↓
API Route (/api/reddit or /api/reddit/me)
    ↓
Token Acquisition (getRedditToken or getSession)
    ↓
Reddit OAuth API (oauth.reddit.com)
    ↓
Response (transformed via RTK Query)
    ↓
Component (auto-cached, auto-refetched)
```

#### Security Features

- **Origin Validation**: All routes validate request origin (CSRF protection)
- **Path Validation**: `isSafeRedditPath()` prevents SSRF attacks
- **Token Encryption**: User sessions stored in encrypted cookies (iron-session)
- **Automatic Rotation**: App tokens rotate proactively before expiration
- **Rate Limiting**: Built into Reddit API proxy with header tracking

### File Structure

```text
├── app/(default)/          # Next.js App Router pages
├── components/             # React components (one per folder)
│   └── ComponentName/
│       ├── ComponentName.tsx
│       ├── ComponentName.module.css
│       └── ComponentName.test.tsx
├── lib/
│   ├── actions/           # Server Actions (Reddit OAuth)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Redux store + RTK Query
│   ├── types/             # TypeScript definitions (auto-generated)
│   └── utils/             # Pure utility functions
├── scripts/               # Build/codegen scripts
└── test-utils/            # Test setup and utilities
```

### NPM Scripts Reference

| Command                    | Purpose                        |
| -------------------------- | ------------------------------ |
| `npm run dev`              | Start development server       |
| `npm run build`            | Production build               |
| `npm run start`            | Start production server        |
| `npm test`                 | Run test suite                 |
| `npm run coverage`         | Test with coverage             |
| `npm run lint`             | Check code quality             |
| `npm run format`           | Format all files               |
| `npm run typegen`          | Generate Reddit API types      |
| `npm run typegen:fetch`    | Fetch samples from Reddit API  |
| `npm run typegen:types`    | Generate TypeScript types      |
| `npm run typegen:validate` | Validate OpenAPI specification |

---

## Reddit API Integration

### Authentication Setup

The app uses **Reddit OAuth 2.0** for API access with multi-environment support:

**Creating Reddit App:**

1. **Visit**: <https://www.reddit.com/prefs/apps>
2. **Create new app**:
   - **Name**: `reddit-viewer`
   - **Type**: `web app`
   - **Description**: `A Reddit viewing web app`
   - **About URL**: `https://reddit-viewer.com`
   - **Redirect URI**: `https://reddit-viewer.com/api/auth/callback/reddit`
3. **Copy credentials** to your `.env` file

**Multi-Environment OAuth:**

The app uses a **shared domain cookie strategy** that enables OAuth to work seamlessly across:

- **Production**: `https://reddit-viewer.com`
- **Preview Deployments**: `https://[pr-id].reddit-viewer.com`
- **Local Development**: `http://localhost:3000` (read-only mode recommended)

**How it works:**

1. All environments redirect to Reddit OAuth
2. Reddit redirects back to production callback (`reddit-viewer.com/api/auth/callback/reddit`)
3. Production callback:
   - Validates OAuth code and exchanges for tokens
   - Creates encrypted session with domain `.reddit-viewer.com`
   - Redirects back to original environment
4. Session cookie is readable by all `reddit-viewer.com` subdomains

**Local Development Options:**

- **Option A (Recommended)**: Use read-only mode locally, test OAuth on preview deployments
- **Option B**: Configure Reddit app with localhost callback (requires manual toggling)

**Server-Side Token Management:**

- **Read-only Mode**: `lib/actions/redditToken.ts` - Application-only OAuth
- **Authenticated Mode**: `lib/auth/arctic.ts` + `lib/auth/session.ts` - User OAuth with Arctic
- **Features**: Automatic token rotation, caching, error handling, multi-environment support
- **Flow**: Server Action → OAuth token → RTK Query → Components

### Type Generation System

**Why?** Automatically generates TypeScript types from live Reddit API responses instead of manually maintaining types.

**Quick Usage:**

```bash
# Generate everything
npm run typegen

# Or step by step:
npm run typegen:fetch     # Fetch samples from Reddit
npm run typegen:types     # Generate TypeScript types
npm run typegen:validate  # Validate OpenAPI spec
```

**What It Does:**

1. **Discovers endpoints** - Finds real post IDs and usernames
2. **Fetches samples** - Gets live data from 6 Reddit endpoints
3. **Infers schemas** - Analyzes JSON to create accurate types
4. **Generates OpenAPI 3.1.1** - Creates complete API specification
5. **Creates TypeScript** - Generates `lib/types/reddit-api.ts` (2,376+ lines)
6. **Validates spec** - Ensures quality with Redocly CLI

**Generated Files:**

- `lib/types/reddit-api.ts` - **Main types file**
- `scripts/reddit-openapi-complete.json` - OpenAPI 3.1.1 spec
- `scripts/generation-summary.json` - Generation metadata

**Endpoints Covered:**

| Endpoint     | Purpose              | Sample URL                             |
| ------------ | -------------------- | -------------------------------------- |
| **Posts**    | Community posts      | `/r/typescript/hot.json`               |
| **About**    | Community info       | `/r/typescript/about.json`             |
| **Search**   | Find communities     | `/subreddits/search.json?q=typescript` |
| **Popular**  | Trending communities | `/subreddits/popular.json`             |
| **Comments** | Post comments        | `/r/typescript/comments/abc123.json`   |
| **Users**    | User profiles        | `/user/username/about.json`            |

---

## Advanced Topics

### Codegen Architecture Deep Dive

**Core Classes:**

- **`OpenAPIGenerator`** - Base class for schema inference and spec generation
- **`DynamicRedditScraper`** - Extends base with Reddit-specific discovery logic

**Schema Inference Algorithm:**

```typescript
// Simplified inference logic
if (value === null) return {type: ['string', 'null']}        // OpenAPI 3.1.1 format
if (Array.isArray(value)) return {type: 'array', items: ...} // Handle arrays
if (typeof value === 'object') return {type: 'object', properties: ...} // Objects
return {type: typeof value} // Primitives
```

**Rate Limiting Strategy:**

- **Delay**: 1-1.5 seconds between requests
- **Error handling**: Automatic retries with exponential backoff
- **Respect**: Reddit API guidelines and quotas

**Validation Pipeline:**

```bash
redocly lint scripts/reddit-openapi-complete.json
```

**Rules enforced:**

- ✅ Valid OpenAPI 3.1.1 structure
- ✅ All operation tags defined
- ✅ License information included
- ⚠️ Path naming (Reddit uses non-kebab-case URLs)

**Extending the System:**

1. Add endpoint config to `redditEndpoints` in `generate-openapi.ts`
2. Implement dynamic discovery in `dynamic-scraper.ts` if needed
3. Run `npm run typegen` to regenerate types

**Configuration**: `redocly.yaml` for validation rules

---

## Getting Help

### Resources

- **Issues**: [GitHub Issues](https://github.com/gregrickaby/viewer-for-reddit/issues) - Bug reports and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/gregrickaby/viewer-for-reddit/discussions) - Questions and community
- **Reddit API**: [Official Documentation](https://www.reddit.com/dev/api/) - API reference
- **Mantine**: [Documentation](https://mantine.dev/) - UI component library

### Before You Ask

1. **Search existing issues** and discussions
2. **Check the documentation** in this file
3. **Try reproducing** the issue locally
4. **Review recent changes** in the Git history

### Reporting Issues

**Good issue reports include:**

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

---

## Legal

This repository is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code, you agree to license your contributions under the [MIT License](https://github.com/gregrickaby/viewer-for-reddit/blob/main/LICENSE).

_Viewer for Reddit is an independent side project and is not affiliated with, endorsed by, or sponsored by Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc., used in accordance with their [brand guidelines](https://redditinc.com/brand). The app developer and contributors endeavor to comply with Reddit's [API terms](https://redditinc.com/policies/data-api-terms) and [Developer Platform](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data) policies._

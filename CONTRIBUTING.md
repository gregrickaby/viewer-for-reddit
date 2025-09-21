# Contributing Guide <!-- omit in toc -->

Welcome! 👋 This guide will help you contribute to Viewer for Reddit, whether you're fixing a bug, adding a feature, or generating types from the Reddit API.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
    - [1. Clone and Install](#1-clone-and-install)
    - [2. Environment Configuration](#2-environment-configuration)
  - [Development](#development)
    - [Start Development Server](#start-development-server)
    - [Code Quality](#code-quality)
    - [Build and Test](#build-and-test)
  - [Testing \& Quality](#testing--quality)
  - [Deployment](#deployment)
    - [Git Workflow](#git-workflow)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [File Structure](#file-structure)
  - [NPM Scripts Reference](#npm-scripts-reference)
- [Reddit API Integration](#reddit-api-integration)
  - [Authentication Setup](#authentication-setup)
    - [Creating Reddit App](#creating-reddit-app)
    - [Server-Side Token Management](#server-side-token-management)
  - [Type Generation System](#type-generation-system)
    - [Quick Usage](#quick-usage)
    - [What It Does](#what-it-does)
    - [Generated Files](#generated-files)
    - [Endpoints Covered](#endpoints-covered)
- [Advanced Topics](#advanced-topics)
  - [Codegen Architecture Deep Dive](#codegen-architecture-deep-dive)
    - [Core Classes](#core-classes)
    - [Schema Inference Algorithm](#schema-inference-algorithm)
    - [Rate Limiting Strategy](#rate-limiting-strategy)
    - [Validation Pipeline](#validation-pipeline)
    - [Extending the System](#extending-the-system)
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
3. **Set up environment**: `cp .env.example .env`
4. **Start development**: `npm run dev`
5. **Open**: <http://localhost:3000>

That's it! You're ready to start contributing. 🎉

---

## Development Workflow

### Prerequisites

- **Node.js v22** (see `.nvmrc`)
- **npm v11+**
- **Git**
- **Reddit API credentials** (optional, for full functionality)

### Setup

#### 1. Clone and Install

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/viewer-for-reddit.git
cd viewer-for-reddit

# Install dependencies (~31 seconds)
npm install
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

**Optional Reddit API Setup** (for full functionality):

- Visit <https://www.reddit.com/prefs/apps>
- Create a new app (type: `script`)
- Add your credentials to `.env`:

```bash
REDDIT_CLIENT_ID="your_client_id_here"
REDDIT_CLIENT_SECRET="your_client_secret_here"
```

> **Note**: The app works without Reddit credentials, but will show "Unable to load posts" messages.

### Development

#### Start Development Server

```bash
npm run dev
```

- **URL**: <http://localhost:3000>
- **Features**: Hot reload, Turbo mode, automatic cache clearing

#### Code Quality

```bash
# Run linting and formatting
npm run lint
npm run format

# Run tests
npm test              # Single run
npm run coverage      # With coverage report
```

#### Build and Test

```bash
# Production build
npm run build

# Test production build locally
npm run build && npm run start
```

### Testing & Quality

- **Tests**: Vitest + React Testing Library + MSW v2
- **Coverage**: Aiming for 100% control flow coverage
- **Linting**: ESLint + Prettier with automatic formatting

```bash
# Test single component (watch mode)
npx vitest ComponentName

# Full test suite
npm test

# Coverage report
npm run coverage
```

### Deployment

#### Git Workflow

1. **Create branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** following coding standards
3. **Quality checks**: `npm run lint && npm test`
4. **Build test**: `npm run build`
5. **Commit and push** your changes
6. **Open Pull Request** with description
7. **Code review** and testing on Vercel preview
8. **Merge** after approval

> **PR Requirements**: Must pass linting, tests, build successfully, and receive peer review.

---

## Project Architecture

### Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React and Mantine
- **Styling**: CSS Modules
- **State**: Redux Toolkit Query (RTK)
- **Types**: TypeScript (strict)
- **Testing**: Vitest + RTL + MSW
- **API**: Reddit REST API + OAuth 2.0

### File Structure

```text
├── app/(default)/          # Next.js App Router pages
├── components/             # React components (one per folder)
│   └── ComponentName/
│       ├── Component.tsx
│       ├── Component.module.css
│       └── Component.test.tsx
├── lib/
│   ├── actions/           # Server Actions (Reddit OAuth)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Redux store + RTK Query
│   ├── types/             # TypeScript definitions
│   └── utils/             # Pure utility functions
├── scripts/               # Build/codegen scripts
└── test-utils/            # Test setup and utilities
```

### NPM Scripts Reference

| Command            | Purpose                   |
| ------------------ | ------------------------- |
| `npm run dev`      | Start development server  |
| `npm run build`    | Production build          |
| `npm run start`    | Start production server   |
| `npm test`         | Run test suite            |
| `npm run coverage` | Test with coverage        |
| `npm run lint`     | Check code quality        |
| `npm run format`   | Format all files          |
| `npm run codegen`  | Generate Reddit API types |

---

## Reddit API Integration

### Authentication Setup

The app uses **Reddit OAuth 2.0** for API access:

#### Creating Reddit App

1. **Visit**: <https://www.reddit.com/prefs/apps>
2. **Create new app**:
   - **Name**: `Viewer for Reddit Local Dev`
   - **Type**: `script`
   - **Description**: `Local development app`
   - **About URL**: `http://localhost:3000`
   - **Redirect URI**: `http://localhost:3000`

3. **Copy credentials** to your `.env` file

#### Server-Side Token Management

- **Location**: `lib/actions/redditToken.ts`
- **Features**: Automatic token rotation, caching, error handling
- **Flow**: Server Action → OAuth token → RTK Query → Components

### Type Generation System

**Why?** Automatically generates TypeScript types from live Reddit API responses instead of manually maintaining types.

#### Quick Usage

```bash
# Generate everything
npm run codegen

# Or step by step:
npm run codegen:fetch     # Fetch samples from Reddit
npm run codegen:types     # Generate TypeScript types
npm run codegen:validate  # Validate OpenAPI spec
```

#### What It Does

1. **Discovers endpoints** - Finds real post IDs and usernames
2. **Fetches samples** - Gets live data from 6 Reddit endpoints
3. **Infers schemas** - Analyzes JSON to create accurate types
4. **Generates OpenAPI 3.1.1** - Creates complete API specification
5. **Creates TypeScript** - Generates `lib/types/reddit-api.ts`
6. **Validates spec** - Ensures quality with Redocly CLI

#### Generated Files

- `lib/types/reddit-api.ts` - **Main types file** (2,376 lines)
- `scripts/reddit-openapi-complete.json` - OpenAPI 3.1.1 spec
- `scripts/generation-summary.json` - Generation metadata

#### Endpoints Covered

| Endpoint     | Purpose         | Sample URL                             |
| ------------ | --------------- | -------------------------------------- |
| **Posts**    | Subreddit posts | `/r/typescript/hot.json`               |
| **About**    | Subreddit info  | `/r/typescript/about.json`             |
| **Search**   | Find subreddits | `/subreddits/search.json?q=typescript` |
| **Popular**  | Trending subs   | `/subreddits/popular.json`             |
| **Comments** | Post comments   | `/r/typescript/comments/abc123.json`   |
| **Users**    | User profiles   | `/user/username/about.json`            |

---

## Advanced Topics

### Codegen Architecture Deep Dive

#### Core Classes

- **`OpenAPIGenerator`** - Base class for schema inference and spec generation
- **`DynamicRedditScraper`** - Extends base with Reddit-specific discovery logic

#### Schema Inference Algorithm

```typescript
// Simplified inference logic
if (value === null) return {type: ['string', 'null']}        // OpenAPI 3.1.1 format
if (Array.isArray(value)) return {type: 'array', items: ...} // Handle arrays
if (typeof value === 'object') return {type: 'object', properties: ...} // Objects
return {type: typeof value} // Primitives
```

#### Rate Limiting Strategy

- **Delay**: 1-1.5 seconds between requests
- **Error handling**: Automatic retries with exponential backoff
- **Respect**: Reddit API guidelines and quotas

#### Validation Pipeline

```bash
redocly lint scripts/reddit-openapi-complete.json
```

**Rules enforced**:

- ✅ Valid OpenAPI 3.1.1 structure
- ✅ All operation tags defined
- ✅ License information included
- ⚠️ Path naming (Reddit uses non-kebab-case URLs)

#### Extending the System

**Adding new endpoints**:

1. Add endpoint config to `redditEndpoints` in `generate-openapi.ts`
2. Implement dynamic discovery in `dynamic-scraper.ts` if needed
3. Run `npm run codegen` to regenerate types

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

**Good issue reports include**:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

---

## Legal

This repository is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code, you agree to license your contributions under the [MIT License](https://github.com/gregrickaby/viewer-for-reddit/blob/main/LICENSE).

**Disclaimer**: This project is not affiliated with, endorsed by, or sponsored by Reddit, Inc. "Reddit" and the Snoo logo are trademarks of Reddit, Inc.

# Contributing <!-- omit in toc -->

Here are the ways to get involved with this project:

- [Issues \& Discussions](#issues--discussions)
- [Reddit API](#reddit-api)
- [Contributing Code](#contributing-code)
  - [Install Locally](#install-locally)
  - [Git Workflow](#git-workflow)
  - [ENV Variables](#env-variables)
  - [NPM Scripts](#npm-scripts)
  - [Vercel CLI](#vercel-cli)
- [Legal Stuff](#legal-stuff)

## Issues & Discussions

Before submitting your issue, make sure it has not been mentioned earlier. You can search through the [existing issues](https://github.com/gregrickaby/viewer-for-reddit/issues) or active [discussions](https://github.com/gregrickaby/viewer-for-reddit/discussions).

---

## Reddit API

Please review the [Reddit API Documentation and Rules](https://github.com/reddit-archive/reddit/wiki/API) before submitting a patch. Also, this project is not affiliated with Reddit in any way.

---

## Contributing Code

Found a bug you can fix? Fantastic! Pull requests are always welcome. Please follow the steps below to get started.

---

### Install Locally

Use `npx` and `create-next-app` to install the project locally:

```bash
npx create-next-app --example https://github.com/gregrickaby/viewer-for-reddit viewer-for-reddit
```

---

### Git Workflow

1. Fork the repo and create a `feature/` or `hotfix/` branch off `main`
2. Work locally adhering to coding standards
3. Run `npm run lint`
4. Make sure the app builds locally with `npm run build && npm run start`
5. Push your code to GitHub and open your PR (note: Your PR will be deployed to Vercel for QA after approval)
6. Fill out the PR template and request a peer review
7. After peer review, the PR will be merged back into `main`
8. Repeat ♻️

> Your PR must pass automated assertions, deploy to Vercel successfully, and pass a peer review before it can be merged.

---

### ENV Variables

In order to authenticate with the Reddit API, you'll need to [create a Reddit app](https://github.com/reddit-archive/reddit/wiki/OAuth2):

1. Visit <https://www.reddit.com/prefs/apps>
   1. Name: `My App`
   2. Type `script`
   3. Description: `My App Description`
   4. About URL: `https://example.com`
   5. Redirect URI: `https://my-app.vercel.app`

Take note of the `client id` and `secret` values. You will need these in a moment.

2. Create an `.env` file in the root of the project:

```bash
cp .env.example .env.local
```

3. Add your token to the `.env.local` file:

```text
# Your Reddit Client ID
# Get one here: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID="YOUR-TOKEN-HERE"

# Search Secret
NEXT_PUBLIC_SEARCH_SECRET="ANY-RANDOM-STRING-HERE"

# Used on production to verify the site with Google Webmaster Tools.
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="YOUR-TOKEN-HERE"
```

> The `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is only needed on Production. You can leave it as-is for local development.

---

### NPM Scripts

There are a few NPM scripts available:

- `npm run dev` - Starts the development server
- `npm run lint` - Runs ESLint and Prettier
- `npm run build && npm start` - Builds the app for production and starts the server. This is great for catching bugs locally prior to a deployment.

---

### Vercel CLI

I've found that running `vercel` locally is a great way to verify Edge Functions and Middleware are working as expected.

To install the [Vercel CLI](https://vercel.com/docs/cli), run:

```bash
npm i -g vercel
```

Then, pull down the ENV variables from Vercel:

```bash
vercel env pull
```

Finally, start a Vercel development server locally:

```bash
vercel dev
```

---

## Legal Stuff

This repo is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code you grant its use under the [MIT](https://github.com/gregrickaby/viewer-for-reddit/blob/main/LICENSE).

---

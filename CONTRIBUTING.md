# Contributing <!-- omit in toc -->

Here are the ways to get involved with this project:

- [Issues & Discussions](#issues--discussions)
- [Contributing Code](#contributing-code)
  - [Install Locally](#install-locally)
  - [Git Workflow](#git-workflow)
  - [ENV Variables](#env-variables)
  - [NPM Scripts](#npm-scripts)
- [Legal Stuff](#legal-stuff)

## Issues & Discussions

Before submitting your issue, make sure it has not been mentioned earlier. You can search through the [existing issues](https://github.com/gregrickaby/reddit-image-viewer/issues) or active [discussions](https://github.com/gregrickaby/reddit-image-viewer/discussions).

---

## Contributing Code

Found a bug you can fix? Fantastic! Patches are always welcome.

---

### Install Locally

Use `npx` and `create-next-app` to install the project locally:

```bash
npx create-next-app --example https://github.com/gregrickaby/reddit-image-viewer reddit-image-viewer
```

---

### Git Workflow

1. Fork the repo and create a feature/patch branch off `main`
2. Work locally adhering to coding standards
3. Run `npm run lint`
4. Make sure the app builds locally with `npm run build && npm run start`
5. Push your code, open a PR, and fill out the PR template
6. After peer review, the PR will be merged back into `main`
7. Repeat ♻️

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
cp .env.example .env
```

3. Add your token to the `.env` file:

```text
# Used to protect the `/api/token` endpoint from brute force attacks
# Can be any random string.
AUTHORIZATION_KEY="ANY-RANDOM-STRING-HERE"

# Your Reddit Client ID
# Get one here: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID="YOUR-TOKEN-HERE"

# Your Reddit Client Secret
# Get one here: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_SECRET="YOUR-TOKEN-HERE"

# Used on production to verify the site with Google Webmaster Tools.
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="YOUR-TOKEN-HERE"

# The URL of the site.
# This is a system ENV on Vercel-- you don't need to set it on Vercel.
# https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables
VERCEL_URL="http://localhost:3000"
```

> The `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is only used on Production. You can leave it as is.

---

### NPM Scripts

There are a few NPM scripts available:

- `npm run dev` - Starts the development server
- `npm run lint` - Runs ESLint and Prettier
- `npm run build && npm start` - Builds the app for production and starts the server. This is great for catching bugs locally prior to a deployment.

---

## Legal Stuff

This repo is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code you grant its use under the [MIT](https://github.com/gregrickaby/reddit-image-viewer/blob/main/LICENSE).

---

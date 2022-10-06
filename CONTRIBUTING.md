# Contributing

Here are the ways to get involved with this project:

- [Contributing](#contributing)
  - [Submitting issues](#submitting-issues)
  - [Contributing code](#contributing-code)
    - [Git Workflow](#git-workflow)
    - [ENV Variables](#env-variables)
  - [Legal Stuff](#legal-stuff)

## Submitting issues

Before submitting your issue, make sure it has not been mentioned earlier. You can search through the [existing issues](https://github.com/gregrickaby/reddit-image-viewer/issues).

---

## Contributing code

Found a bug you can fix? Fantastic! Patches are always welcome.

---

### Git Workflow

1. Fork the repo and create a feature/patch branch off `main`
2. Work locally adhering to coding standards
3. Run `npm run lint` before opening a Pull Request (PR)
4. Make sure the app builds locally with `npm run build && npm run start`
5. Fill out the PR template
6. Your PR must pass automated assertions and deploy to Vercel successfully
7. After peer review, the PR will be merged back into `main`
8. Repeat ♻️

---

### ENV Variables

In order to authenticate with Reddit, you'll need an OAuth2 access token. For development purposes, a temporary token should be fine.

1. Generate a temporary anonymous token at <https://not-an-aardvark.github.io/reddit-oauth-helper/> (the first field at the top of the page)

2. Create an `.env` file in the root of the project:

```bash
cp .env.example .env
```

3. Add your token to the `.env` file:

```bash
REDDIT_ACCESS_TOKEN="YOUR-TOKEN-HERE"
```

> If you want to generate a permanent token for Reddit, visit <https://www.reddit.com/prefs/apps/> to create an app, then follow the instructions <https://github.com/reddit-archive/reddit/wiki/OAuth2>

> The `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is only used on Production. You can leave it as is.

---

## Legal Stuff

This repo is maintained by [Greg Rickaby](https://gregrickaby.com/). By contributing code you grant its use under the [MIT](https://github.com/gregrickaby/reddit-image-viewer/blob/main/LICENSE).

---

---
name: commit
model: claude-haiku-5-5
context: fork
description: >
  Commit the working tree as small conventional commits, one per logical chunk of work. Use when the user says "commit", "micro commit", "commit this", or "/commit". Pushes a task branch and opens a pull request that merges itself when CI passes.
---

# Commit

Split the uncommitted work into small Conventional Commits on a task branch, push it, and open a pull request that merges itself when CI passes. CI runs the build and E2E; Coolify deploys `main`.

You run in a fresh context: you can't see the conversation, and nobody answers questions. Make each call yourself with the defaults below, and explain it in the report. Never push to `main`, tag, or merge by hand.

## 1. Check the review

The `code-review` skill records a hash of the tree it passed. Compare it with the current tree before anything else:

```bash
cmp -s <(.claude/skills/code-review/tree-hash.sh) "$(git rev-parse --git-dir)/review-passed" && echo reviewed
```

If it doesn't print `reviewed`, commit nothing and report: "The tree changed since the last passing review, or none ran. Run /code-review first." Don't edit any file before committing; the hash covers the whole tree.

## 2. Survey

1. Run `git status --short` and `git diff --stat HEAD`. Stop and report if a merge, rebase, or cherry-pick is in progress. If the branch is `main`, create one named `<type>/<short-slug>` for the main change (`git switch -c`); the review hash still matches.
2. Read the diff one file or group at a time (`git diff HEAD -- <paths>`), not the whole tree at once. Read new text files in full; for new binaries (images, fonts), the file name is enough.
3. Commit the whole working tree. Leave out only files that look unrelated to the rest (a stray config tweak, a local env file), and list them in the report.

## 3. Group

Each commit is one change a reviewer could revert on its own: a feature, a fix, a dependency bump.

- Tests go with the code they cover, including e2e specs and `e2e/mock-reddit` changes.
- `lib/reddit/schemas/generated.ts` and its `fixtures/reddit/things` inputs go with the code that needed the regenerated schema.
- `package.json` and `package-lock.json` go together, in their own commit unless the dependency was added for a feature in the same change.
- Order commits so each one builds: helpers before their callers, schemas before the views that use them, tokens before the CSS that uses them.
- Never force-add gitignored files (CSS module `.d.ts`).

A file with two changes in it gets split: write a version with only the first change to the scratchpad, stage it, commit, then `git add` the real file for the next commit.

```bash
git update-index --add --cacheinfo 100644,$(git hash-object -w /path/to/partial),path/in/repo
```

When a clean split would need partial versions of more than a few files, group by feature instead, put each mixed file in the commit of its main change, and say so in the report. The review verified only the final tree, so intermediate commits may not build.

## 4. Write each message

- `type: subject`, with type one of `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`. A plain dependency bump uses the subject `dependency bump`.
- Subject: lowercase, imperative, no period, under 72 characters. Say what changed for the reader of the site or for the tooling, not which files moved.
- Before each commit, read `git diff --cached` and check that the subject covers every change in it. If one subject can't, split the commit or list the rest in a body.
- Cite the reason when it's an outside event: a Dependabot alert number, a Node security release, a Reddit API change.
- Add a body only for a reason the subject can't give. Wrap at 72 columns.
- Follow the writing rules in `docs/code-standards.md`: no emoji, no em dashes, plain verbs.
- No trailers, co-authors, or "Generated with" lines.

## 5. Commit

Let the lefthook pre-commit hooks run; never pass `--no-verify` or skip them some other way. The hooks format and lint the staged files. If a hook fails on something you can fix without changing behavior (formatting, import order), fix it and commit again. Otherwise stop and report.

## 6. Open the pull request

```bash
git push -u origin HEAD
gh pr create --base main --title "<the main commit's subject>" --body "<one line per commit, plus anything a reviewer should know>"
gh pr merge --auto --rebase --delete-branch
```

Rebase merging keeps each small commit on `main`. The body follows the same writing rules and has no "Generated with" line. Don't wait for CI.

## 7. Report

- The commits, as `sha subject`.
- The pull request URL, and whether auto-merge is on.
- Files left uncommitted, and why.
- Mixed files and the commit that holds each.
- Any other call you made on your own.

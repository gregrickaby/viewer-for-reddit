---
name: commit
description: Commit the working tree as small conventional commits, one per logical chunk of work. Use when the user says "commit", "micro commit", "commit this", or "/commit". Does not push unless asked.
---

# Commit

**Triggers:** "commit", "micro commit", "commit this", `/commit`

Split the uncommitted work into small commits, one per logical change, with Conventional Commit subjects. Asking for this skill is the user's go-ahead to commit. Push only when the user asks in the same request.

## 1. Survey

1. Run `git status --short` and `git diff` (plus `git diff --cached` if anything is staged). Read new files in full.
2. Note changes you did not make in this session (for example `AGENTS.md` edits or config tweaks). Leave them unstaged and list them in the report, unless the user said to include them.
3. If `npm run check` has not passed since the last edit, run it now. Stop and report if it fails.

## 2. Group

Each commit is one change a reviewer could revert on its own: a feature, a fix, a dependency bump, a test-only change. Rules:

- Tests go in the commit with the code they cover, including e2e specs and `e2e/mock-reddit` changes.
- Generated files (CSS module `.d.ts`) are gitignored. Never force-add them.
- `lib/reddit/schemas/generated.ts` and its `fixtures/reddit/things` inputs go in the same commit as the code that needed the regenerated schema.
- `package.json` and `package-lock.json` changes go together, in their own commit unless the dependency was added for the feature in the same change.
- Order commits so each one builds: helpers before their callers, schemas before the views that use them, tokens before the CSS that uses them.

When one file holds two changes, stage a version of it with only the first change. `git add -p` is interactive and unavailable, so write the partial version to the scratchpad and stage it directly:

```bash
git update-index --add --cacheinfo 100644,$(git hash-object -w /path/to/partial),path/in/repo
```

Commit, then `git add` the real file for the next commit. Check any commit built from a partial file in a temporary worktree (`git worktree add <dir> <sha>`, symlink `node_modules`, run `npm run check`, then `git worktree remove --force <dir>`).

## 3. Write messages

- Format: `type: subject`. Types used here: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`. Plain dependency bumps use the subject `dependency bump`.
- Subject: lowercase, imperative, no period, under 72 characters. Say what changed for the reader of the site, not which files moved.
- Cite the reason when it's an outside event: a Dependabot alert number, a Node security release, a Reddit API change.
- Add a body only when the reason is not obvious from the subject. Wrap at 72 columns.
- Follow `~/.claude/rules/writing-style.md`: no emoji, no em dashes, plain verbs.
- No trailers, no co-authors, no "Generated with" lines.

## 4. Commit

- Never pass `--no-verify` or skip hooks some other way. If a hook fails, fix the cause and commit again.
- Commit on the current branch. This repo commits to `main` directly.
- Do not push, tag, or open a PR unless the user asked.

## 5. Report

List the commits as `sha subject`, say whether anything was pushed, and name any files left uncommitted and why.

---
name: start-work
description: Read a GitHub issue and start working on it on a new branch. Use when the user pastes an issue URL or number, or says "start work on #123" or "/start-work".
---

# Start work

Take an issue from read to a finished, checked change. Runs in this session; `code-review` and `commit` ship it afterward, only when the user asks.

## Steps

1. **Read the issue:** `gh issue view <number> --json title,body,labels,comments`. Pull out what's broken or wanted, the "done when" checks, and anything marked unknown. If `gh` fails, report the error and stop.
2. **Check the tree:** `git status --short`. If it's dirty, say what's uncommitted and stop.
3. **Branch:** `git switch main && git pull && git switch -c <type>/<number>-<short-slug>`, type from the commit types (`fix` for a `bug` label, `feat`, `chore`, and so on).
4. **Plan:** read the code the issue names, plus each file you'll change and its tests. Read `docs/code-standards.md` once per session. Write a short numbered plan in chat: files and why, assumptions, open questions. Answer the issue's unknowns from the code before guessing. Proceed without waiting, unless the requirements conflict or the fix needs a dependency, a design call, or a change to UI copy; then ask.
5. **Implement:** the plan and the tests that pin it, including any E2E checks the issue asks for. Note out-of-scope problems for the report; don't fix them.
6. **Validate:** `npm run format && npm run check 2>&1 | tail -40`. Fix failures and re-run until clean, with coverage at or above the 95% threshold in `vitest.config.ts`. Never run `npm run build` or `npm run test:e2e`; CI runs them.

## Report

- What changed and why, mapped to the issue's "done when".
- Files changed.
- What CI or the user should check: the E2E specs CI will run, and pages to open on the dev server.
- Assumptions and open questions.

Use `Fixes #<number>` in the pull request body when `commit` opens it.

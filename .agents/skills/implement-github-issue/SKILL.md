---
name: implement-github-issue
description: >
  Implement a GitHub issue for this Next.js 16 + Mantine 9 website.
  Reads the issue, explores all referenced source files, presents a
  file-by-file implementation plan, resolves ambiguities with the user,
  executes the plan, and validates. Use when the user pastes a GitHub issue
  URL or says "implement this issue" / "work on issue #N".
---

# Implement GitHub Issue

## When to Load This Skill

- User pastes a `github.com/.../issues/N` URL
- User says "implement this issue", "work on issue #N", "do this issue"

## Process

### 1. Fetch the Issue

```bash
gh issue view <N> --repo <owner>/<repo>
```

Read the full body: problem statement, proposed interface, dependency strategy, testing strategy, and implementation recommendations. The issue is the spec — treat it as authoritative.

### 2. Explore All Relevant Source Files

Spawn one `Explore` sub-agent with a brief that includes:

- Every file path referenced in the issue
- A request to also return: existing test files for those paths, `lib/types.ts`, `lib/config.ts`, any `lib/*.ts` the new module will call, and `test-utils/render.tsx`
- Instruction to report file contents, existing test patterns, types used, and any callers of the affected modules

Use the consolidated summary the agent returns as the basis for the plan. Do NOT manually chain file reads — keep the main agent's context clean for implementation.

### 3. Identify Special Cases and Ambiguities

Before presenting the plan, note any deviations from the issue's proposed interface:

- Files that use the old pattern in a non-standard way (e.g. hardcoded values instead of reading from meta)
- Callers that will need different handling than the issue describes
- Behavioural changes the refactor introduces (e.g. a null guard that previously returned a fallback now returns `{}`)

**Ask the user about each ambiguity before writing a single line of code.** One focused question per ambiguity.

### 4. Present the Implementation Plan

Write a complete, file-by-file plan **before touching any file**. Include:

- New files to create (with the full proposed public interface)
- Existing files to edit (before/after snippets for changed sections)
- Test files to create
- Test cases to remove (boilerplate tests now covered by the new boundary tests)
- Any imports to add or remove in each file

The plan must be specific enough that the user can approve or redirect it without needing to ask further questions.

### 5. Execute

Use TodoWrite to create a task for each file change before starting. Mark tasks `in_progress` as you start them and `completed` immediately after finishing each one — never batch completions.

**Order of operations:**

1. New `lib/` modules first
2. New test files for those modules
3. Edit existing source files (remove old logic, add new imports, call new module)
4. Edit existing test files (remove redundant test cases)

**Code standards to follow** (see `AGENTS.md`):

- Full JSDoc on every exported function and interface — `@param`, `@returns`
- Explicit TypeScript return types on all `lib/` functions
- No `any` — use `unknown` and narrow
- CSS modules for styles; Mantine primitives for layout
- `'use client'` only when using hooks, state, effects, or browser APIs

### 6. Validate

```bash
npm run validate
```

This runs `tsc --noEmit`, ESLint, Prettier, and Vitest with coverage. Fix every error before declaring done — do not move on with a red build.

**Common post-edit errors to watch for:**

- Removed an import that is still used elsewhere in the same file (e.g. `siteConfig` removed from page imports but still used in `buildWebPageGraph` calls in the page component body)
- Missing JSDoc on a new exported function
- A branch in new code that no test exercises — check the coverage report and add a test to close it

If `validate` fails, fix the errors and re-run. Repeat until clean.

### 7. Code Review

Load and run the [Code Review skill](../code-review/SKILL.md) on all changed files. This is **required** — do not skip it and do not declare the task done before it completes. Fix every CRITICAL and IMPORTANT finding before moving on.

### 8. Report

Summarise what was done:

- Files created
- Files modified
- Tests added / removed
- Final test count and pass status

DO NOT COMMIT OR PUSH — the user will review the changes and commit themselves.

## Project Conventions Quick Reference

| Concern                   | Rule                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Component type            | Server by default; `'use client'` only for hooks/state/effects/browser APIs                         |
| Links                     | `<Anchor component={Link}>` — never bare `<a>`                                                      |
| Images                    | `next/image` — never `<img>`                                                                        |
| Colors                    | `tomato` theme; `light-dark()` in CSS; no hardcoded hex values                                      |
| Secrets                   | `.env.local` only; no `NEXT_PUBLIC_` for server-only values                                         |
| `dangerouslySetInnerHTML` | Allowed only with sanitized input via `sanitizeText()` from `sanitize-html`                         |
| Tests                     | Vitest globals (no imports of `describe`/`it`/`expect`/`vi`); custom `render` from `test-utils/`    |
| Naming                    | Dirs: `kebab-case`; Components: `PascalCase`; lib files: `camelCase`; constants: `UPPER_SNAKE_CASE` |

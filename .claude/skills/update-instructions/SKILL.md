---
name: update-instructions
description: >
  Audit and update all agent instruction files, skills, and AGENTS.md for this Next.js 16 + Mantine 9 website. Explores the live codebase to find outdated rules, missing sections, and stale references, then applies fixes. Use when the codebase has changed significantly, after adding a major feature, or when instructions feel out of sync with reality.
---

# Update Instructions

## When to Load This Skill

- User says "update the instructions", "update the docs", "keep instructions in sync"
- User says "the instructions are outdated"
- After implementing a major feature (e.g., caching, new lib module, new component pattern)
- After a dependency upgrade that changes patterns (Next.js major, Mantine major)

## Files to Audit

| File                                                     | Purpose                                                 |
| -------------------------------------------------------- | ------------------------------------------------------- |
| `AGENTS.md`                                              | Top-level project overview, architecture map, key rules |
| `.agents/instructions/reddit-api.instructions.md`        | Coding conventions, patterns, rules                     |
| `.agents/instructions/testing-standards.instructions.md` | Coding conventions, patterns, rules                     |
| `.agents/instructions/writing-style.instructions.md`     | Prose style rules                                       |
| `.agents/skills/*/SKILL.md`                              | Domain-specific workflow skills                         |

## Process

### Step 1: Explore the Live Codebase

Spawn a sub-agent (or run searches in parallel) to collect ground truth:

1. **Project metadata** — read `package.json` for exact dependency versions and npm scripts
2. **Config** — read `next.config.ts` for enabled features (`cacheComponents`, `reactCompiler`, image config, etc.)
3. **lib/ inventory** — list every file; note what each exports and whether it is server-only
4. **components/ inventory** — list every directory; note `'use client'` usage, CSS modules, test coverage
5. **app/ routes** — list all pages and API routes
6. **Key patterns in use** — scan for `'use cache'`, `Suspense`, `dangerouslySetInnerHTML`, logging calls
7. **Test setup** — read `vitest.config.ts` for globals, environment, coverage settings
8. **Deployment** — read `nixpacks.toml` and `next.config.ts` for deployment-relevant settings

### Step 2: Compare Against Each File

For each file in the audit list, check for:

- **Stale facts**: version numbers, file names, directory paths that no longer match the codebase
- **Missing sections**: patterns that exist in the codebase but are not documented
- **Wrong rules**: rules that contradict current practice (e.g., "do not use X" when X is now used)
- **Redundancy**: content duplicated across files — keep the canonical location, trim the copy
- **Out-of-scope content**: detail that belongs in a different file (e.g., architecture in code-standards instead of AGENTS.md)

### Step 3: Plan Changes

Before editing, present a concise diff plan:

```
AGENTS.md
  - Update architecture block (add proxy.ts, lib/axiom/, etc)
  - Update Key Rules (dangerouslySetInnerHTML, axiom/server.ts import rule)

code-standards.instructions.md
  - Remove Project Structure section (redundant with AGENTS.md)
  - Update Routing rule (API routes exist for infra concerns)
  - Add Logging section (Axiom server/client patterns)
  - Add Cache Components section

skills/next-cache-components/SKILL.md
  - No changes needed
```

Ask the user to confirm before writing any changes.

### Step 4: Apply Changes

Use `multi_replace_string_in_file` for multiple edits to the same file in one call.

Rules for edits:

- Drop sections only when the content is fully covered elsewhere or is factually wrong
- Add sections when a real pattern exists in the codebase but has no documentation
- Keep each file focused on its purpose (AGENTS.md = overview; code-standards = rules; skills = workflows)
- Do not add prose explanations — use bullet points and short imperative statements
- Do not create new files unless a genuinely new topic has no home

### Step 5: Validate

After all edits:

1. Re-read each modified file end-to-end and check for internal consistency
2. Confirm no rule in one file contradicts a rule in another
3. Report a brief summary of every change made

## Scope Boundaries

This skill updates **documentation only** — it does not change source code, tests, or configuration files. If exploration reveals a code issue worth fixing, note it in the summary for the user to address separately.

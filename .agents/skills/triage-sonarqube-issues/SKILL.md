---
name: triage-sonarqube-issues
description: >
  Pull open issues and quality gate status from the local SonarQube
  instance for this project, cluster them by rule and severity,
  separate real bugs/vulnerabilities from low-value code-smell noise,
  and root-cause the actionable ones against this codebase. Use when
  the user asks to check the quality gate, triage Sonar issues, find
  blockers before a merge, or figure out what SonarQube is actually
  flagging. Produces a prioritized fix plan, not code changes —
  implementation is a separate, explicit step.
---

# triage-sonarqube-issues

**REQUIRED SUB-SKILL:** Use `sonarqube-mcp` for exact tool names, parameters, and response shapes. This skill assumes those tools are already connected and covers what's specific to triaging *this* project's results: which rules are worth acting on, where in the codebase to ground them, and how to report back.

SonarQube CE flags a wide mix of severities and rule categories. A large share of `LOW`/`INFO` code-smell issues here are naming/complexity nits that don't matter as much as `BLOCKER`/`HIGH` bugs, vulnerabilities, and security hotspots. The job is separating that noise from the small number of issues worth fixing, then grounding each real one in the actual code.

## 1. Check the quality gate first

```
get_project_quality_gate_status(projectKey: "viewer-for-reddit")
```

If `status: "ERROR"`, read the `conditions` array — it names which metrics failed (coverage, duplications, new bugs, etc.) and by how much. This tells you where to focus before pulling the full issue list.

## 2. Pull and cluster issues

```
search_sonar_issues_in_projects(projects: ["viewer-for-reddit"], severities: ["BLOCKER", "HIGH"])
```

Run a second pass with `["MEDIUM", "LOW"]` only if the gate failed on maintainability/code smells specifically — otherwise low-severity issues are rarely worth triaging in one pass. Group results by `rule` key and impact category (Reliability / Security / Maintainability) before reading individual issues one by one.

## 3. Sort noise from real issues

Patterns that are usually noise in this codebase, don't spend time here unless they're gating the build:

- Cognitive-complexity / cyclomatic-complexity smells on components with large `switch`/conditional JSX trees (common in `components/ui/`) — often intentional given Mantine's prop-driven rendering, not a real maintainability risk unless the function is also hard to test.
- Duplicated string literals in `.test.ts`/`.test.tsx` files — test fixtures repeat mock data on purpose; `sonar.coverage.exclusions` already excludes these from coverage but not from duplication/smell checks.
- Naming-convention issues on generated code (`lib/types/reddit-api.ts` is excluded via `sonar.exclusions`, but check `scripts/reddit-openapi.json`-adjacent generated output isn't slipping through).

Signals that something is a real, actionable issue:

- Any `BLOCKER`/`HIGH` in the **Security** or **Reliability** category — these map to actual bug/vulnerability rules, not style.
- Security Hotspots involving `dangerouslySetInnerHTML`, raw HTML interpolation, or template strings built from user input — check whether `sanitizeText()` (CLAUDE.md's required sanitization helper) was actually applied at that call site.
- Issues on files under `lib/actions/`, `lib/auth/`, or `app/api/` — these are the auth/Reddit-API boundary; CLAUDE.md requires asking before changing that code, so flag these even if the fix looks trivial.
- New issues on files touched by the current branch's diff (`git diff main...HEAD --name-only`) — prioritize these over pre-existing issues in untouched files, since they're regressions, not inherited debt.
- Duplicated code blocks spanning non-test source files — a real maintainability signal here, unlike the test-fixture case above.

Use `show_rule(key: "<ruleKey>")` for any rule you don't immediately recognize — don't guess at what a rule enforces from its name alone.

## 4. Root-cause against the code

For each issue that survives step 3, read the flagged file and line, don't take the issue description at face value. Dispatch to an `Explore` agent (research only, no edits) when there are several issues to chase in parallel; it should report file paths, line numbers, and a one-paragraph root-cause hypothesis per issue, not fix anything.

Ground hypotheses in this project's conventions from CLAUDE.md:

- Race-condition rules on async handlers: check for the required `if (isPending) return` guard.
- Rules about `useCallback`/`useMemo`/`memo`: this project intentionally omits these (React Compiler handles it) — a Sonar rule suggesting them is a false positive worth marking, not fixing.
- Type-safety rules flagging `any`: always a real issue here, `"any"` is banned project-wide.
- Rules on Server Actions: confirm `"use server"` is scoped correctly and `redditFetch<T>()` usage in `lib/actions/reddit/` matches `.claude/rules/reddit-api.md` conventions.

## 5. Report and plan — don't implement yet

Output a prioritized table: rule → severity/category → count → verdict (noise / real issue) → file(s):line → one-line root cause → proposed fix → risk note. Flag anything touching auth flow, API structure, or dependencies explicitly per CLAUDE.md's "ask before" list, even if the fix looks small. Only move into implementation after the user confirms scope; then follow this repo's normal definition of done (`npm run validate`, `npm run build`, re-run `npm run sonar` to confirm the gate clears) before declaring any fix complete.

If the user wants to dismiss an issue as a false positive or accepted debt, present it first and get explicit confirmation before calling `change_sonar_issue_status` — never change issue status autonomously.

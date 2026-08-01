---
name: triage-datadog-errors
description: >
  Pull production errors from Datadog for a time window, cluster them
  into patterns, separate real bugs from browser/network noise, and
  root-cause the actionable ones against this codebase. Use when the
  user asks to check Datadog for errors, triage overnight/weekend
  issues, or find out what broke in production. Produces a prioritized
  fix plan, not code changes — implementation is a separate, explicit
  step.
---

# triage-datadog-errors

Reddit Viewer's error surface is noisy by design: it's a public,
anonymous-friendly Reddit client, so a large share of "errors" are
third-party script noise, flaky mobile networks, and expected
auth-expiry fallbacks — not bugs. The job here is separating that
noise from the small number of real, fixable issues, then grounding
each real issue in the actual code before proposing a fix.

## 0. Setup (once per session)

Load Datadog domain skills before querying — they document correct
attribute names and query syntax that generic guessing gets wrong:

```
load_datadog_skill(datadog/error-tracking)
load_datadog_skill(datadog/investigation-workflows)
list_datadog_skills(query: "logs querying patterns")   # then load datadog/querying-patterns if relevant
```

Confirm the CLI is authenticated (tokens expire ~1h):

```bash
pup auth status   # if expired: pup auth refresh, then pup auth login if that fails
```

Use both the MCP tools and `pup` — MCP for structured aggregation
(clustering, group-by, RUM), `pup` as a fast cross-check and for
anything the MCP toolset doesn't cover (e.g. quick counts, downtime
context).

## 1. Pull the window

Default window: `now-3d` for a "weekend" or "since Friday" ask;
`now-24h` for "overnight"; otherwise match what the user says. Run
these in parallel — they answer different questions and none blocks
the others:

```
search_datadog_logs(query="status:error", use_log_patterns=true,
  pattern_group_by=["service"], from=<window>)   # clustered patterns + counts, not raw spam
search_datadog_incidents(query="*", from=<window>)   # was anything formally declared?
search_datadog_rum_events(query="@type:error", from=<window>)   # frontend/browser errors
```

```bash
pup logs aggregate --query "status:error" --compute count --from 3d   # cross-check total volume
```

If RUM volume is high, follow up with
`aggregate_rum_events(query="@type:error", group_by={fields:["@issue.id"]})`
to rank distinct issues by occurrence count — Error Tracking dedupes
by root cause, so this is a better priority signal than raw event
count.

## 2. Cluster, don't read line-by-line

`use_log_patterns=true` collapses thousands of lines into ~20-30
patterns with first_seen/last_seen/count. Triage at the pattern level.
For every pattern that looks server-side, app-specific, or unfamiliar
(not obviously third-party/browser noise), pull full detail:

```
search_datadog_logs(query="\"<exact pattern message>\"", extra_fields=["*"], from=<window>)
```

Read the `custom.*` attributes this app logs (see
`lib/datadog/server.ts` / `lib/datadog/client.ts` call sites) —
`custom.context` names the calling function, `custom.error` carries
the underlying message, and for RUM events `issue_id` groups
occurrences of the same root cause.

## 3. Sort noise from bugs

Known noise patterns in this app, don't spend time on these unless
volume spikes far outside baseline:

- `Uncaught "Script error."` — cross-origin script errors, almost
  always a browser extension or third-party script, not this app's
  code (no stack trace is available by design).
- `Failed to fetch RSC payload... Falling back to browser navigation`
  — Next.js's own soft-nav fallback on flaky networks; it already
  recovers gracefully.
- `Can't find variable: _AutofillCallbackHandler`,
  `intervention: Ignored attempt to cancel a touchend event...` —
  browser/OS chrome, not app code.
- Video/media playback errors (`MEDIA_ERR_SRC_NOT_SUPPORTED`, etc.) —
  third-party media hosts, not this app's player unless volume spikes.

Signals that something is a real, actionable bug:

- The same error recurs many times **within one session** in a short
  window — a user hitting a broken code path repeatedly (e.g. reload
  loop), not independent random users.
- `csp_violation` events — a Content-Security-Policy directive in
  `next.config.ts` is out of sync with content the app actually
  renders (check `lib/utils/formatters.ts` for anything that rewrites
  links into `<img>`/`<video>` tags pointing at a host not in the
  CSP).
- Errors naming this app's own custom log contexts
  (`custom.context: SubredditPageError`, `fetchSubredditInfo`,
  `OAuth`, etc.) rather than raw browser exception types.
- A "possible CSRF/security" log firing for requests that carry a
  legitimate-looking referer (e.g. `reddit.com`) — worth checking
  whether it's a real attack or a false positive from a cookie
  lifecycle / double-submit bug before treating it as a security
  event.
- Malformed-URL-shaped browser errors (`history.replaceState`
  `SecurityError`, double-slash paths) — usually an unvalidated value
  interpolated into a route href somewhere in `components/`.

## 4. Root-cause against the code

For each pattern that survives step 3, don't guess — read the code.
Dispatch this to an `Explore` agent (research only, no edits) when
there are several patterns to chase in parallel; it should report
file paths, line numbers, and a one-paragraph hypothesis per pattern,
not fix anything. Ground every hypothesis in:

- The server action or route handler named in `custom.context`
  (`lib/actions/reddit/`, `app/api/auth/`).
- The relevant `error.tsx`/`not-found.tsx` boundary for the route
  (`.claude/rules/testing-standards.md` and CLAUDE.md both point at
  `error.tsx`/`loading.tsx` as the standard boundary — a route missing
  one where sibling routes have it is a strong signal).
- `next.config.ts` for CSP/headers issues.
- `proxy.ts` for anything that could double-fire a route (prefetch,
  redirects) before blaming application code.

## 5. Report and plan — don't implement yet

Output a prioritized table: pattern → count → verdict (noise /
confirmed bug) → file(s) → one-line root cause → proposed fix →
risk/blast-radius note. Flag anything touching auth flow, API
structure, or dependencies explicitly — CLAUDE.md requires asking
before touching those, even if the "fix" is small. Only move into
implementation after the user confirms scope; then follow this repo's
normal definition of done (`npm run validate`, `npm run test`,
`npm run build`, SonarQube check) before declaring any fix complete.

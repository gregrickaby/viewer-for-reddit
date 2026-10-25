---
name: triage-errors
description: Triage production errors for reddit-viewer.com from Datadog, Coolify, and Cloudflare. Use when asked to check errors, triage, or see what broke since a given time (for example "since 10pm last night").
---

# Triage errors

The site runs on Coolify (app `viewer-for-reddit`) behind Cloudflare. Datadog has browser RUM and logs, server logs over HTTP intake, APM traces (`dd-trace` preloaded by `npm start`, sent to the "Datadog Agent" Coolify service), and one synthetics uptime monitor.

Read-only. Never start the dev server, and never change monitors, synthetics, Coolify, or Cloudflare settings while triaging.

## 1. Set the window

Convert the user's start time to UTC. Default to the last 24 hours if none is given.

## 2. Datadog errors

```bash
pup logs search --query "status:error" --from <ISO-UTC> --to now --limit 1000 --storage indexes > errs.json
```

Write output to the session scratchpad. Group by `source:` tag (`source:browser` or server), `env:` tag, view path (`attributes.view.url_details.path`), and message. Treat `env:local` entries as dev noise and report them separately.

Also check monitors: `pup monitors list` (look at `overall_state`). The "APM 5xx responses" monitor reads No Data until a 5xx happens; that is normal.

## 3. Coolify and Cloudflare

Coolify MCP. Find the app by name first, then use its UUID for the rest:

- `list_applications` or `search_resources` with `viewer-for-reddit`: the app's UUID.
- `list_deployments(application_uuid=...)`: newest deployment and its status.
- `get_deployment(include_log_summary=true)` for a failed build.
- `get_logs` for the running container's server output. It only works while the app is running.

Cloudflare MCP: check for 5xx at the edge, WAF blocks, or cache rules that could explain an error. Read-only.

## 4. Triage

For each distinct error, give: count, where (browser or server, path), first and last seen, likely cause, and a verdict: fix now, watch, or ignore. Match browser errors to server errors by time and path. Check `git log` around the first-seen time for a deploy that could explain it.

For server errors with APM on, pull traces for the same window: `pup traces aggregate` or the Datadog MCP, filtered to `service:reddit-viewer status:error`.

Cloudflare sits in front. A browser `Fetch error POST` whose stack is HTML titled `502: Bad gateway` means Cloudflare could not reach the origin. Compare its time with Coolify deployments before blaming code; one that matches no deploy points at the origin or the path to it.

Known non-issues: `Uncaught "Script error."` with no stack from the Instagram iOS in-app browser or Mobile Safari (injected scripts). `Can't find variable: EmptyRanges` from `syncControl`/`endTimeForBufferedRangeContainingCurrentTime` (WebKit's own media controls). `XHR error` on `v.redd.it` and `Fetch error` on `preview.redd.it` in one session (Reddit media or a dropped connection). View transition aborts ("Viewport size changed", "Prepaint layout check failed"). A single `UnrecognizedActionError` within minutes of a deploy (a tab left open across it). "Transition was aborted because of invalid state. Document hidden" (a backgrounded dev tab). A lone `Minified React error #419` from one device is a watch item, not a fix, unless it repeats or a server error matches.

## 5. Report

Lead with the verdict in one or two sentences, then a short table of errors. Say plainly what was not checked (for example, non-indexed logs). Follow `~/.claude/rules/writing-style.md`: no emoji, no em dashes.

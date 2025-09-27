<!-- AGENT-ONLY: concise machine-readable runbook for automated agents -->

# copilot-instructions (agent-only)

last-updated: 2025-09-27
audience: ai-agent
see-also: CLAUDE.md (for comprehensive guidance)

purpose: >-
Minimal, deterministic runbook for automated agents working on viewer-for-reddit.
This file is NOT intended for human onboarding; it encodes required validation
gates, timeouts, and preferred tools (Playwright MCP) for visual debugging.

invariants:

- do-not-exfiltrate-secrets: true
- node: 22.x (use `.nvmrc`)
- npm: 11.x

timeouts:

- install: 60s
- typegen: 60s
- test-suite: 120s
- lint: 30s

validation-gate (code-edit): |
For any change that modifies code (files with extensions: .ts, .tsx, .js, .jsx, .css, .scss, .json, .html):

1. If you changed API spec files (scripts/_.json or scripts/reddit-openapi_.json) or anything under lib/types, run:
   - npm run typegen:types
2. Run in order (stop if a step fails):
   - npm run lint
   - npm run typecheck
   - npm run test
3. For UI changes, also run:
   - npm run test:e2e
4. If tests fail, run the failing tests locally (npx vitest <path> --run) and collect errors. Check `test-utils/msw/handlers.ts` before editing production code.

skip-validation (docs-only): |
If the change touches only documentation, markdown, or non-code comments, SKIP the full validation gate. Detect by comparing changed file paths.

playwright-mcp (visual-debugging): |
Use Playwright MCP for UI reproduction and visual debugging before changing UI code. Preferred workflow:

1. Open page via Playwright MCP (navigate to http://localhost:3000 or the route under test).
2. Capture accessibility snapshot / network requests via MCP.
3. Use MCP actions (click/type) to reproduce the failing flow and capture a final snapshot.
4. Attach snapshot and network logs to bug/generate a minimal failing test.

agent-workflow (recommended): |

1. Read large, relevant files with semantic_search/read_file.
2. Reproduce the issue with narrow tests or Playwright MCP snapshots.
3. Propose a minimal patch with a 2–3 line contract (inputs, outputs, success criteria).
4. Apply patch (apply_patch). Keep changes small and focused.
5. Run the validation-gate (if code-edit).
6. Report concise delta: files changed, tests run (PASS/FAIL), next steps.

bailout-rules:

- give-up-after-attempts: 3
- avoid-repeating-failed-tool-calls: true
- long-running-commands: abort and report if > 2x timeout above

debugging-tips:

- If tests fail and appear network-related, check `test-utils/msw/handlers.ts` first.
- For flaky tests: ensure `userEvent.setup()` per test and reset mocks between tests.
- For TypeScript errors: run `npm run typecheck` and inspect the top-level failing files.
- For build issues caused by Google Fonts in CI: prefer `npm run dev` locally or self-host fonts in CI.

reporting:

- Always include the exact commands run and their exit codes.
- For failing CI gates, attach full `npm run typecheck` and `npm run test` outputs and any Playwright MCP snapshots.

test-driven-development:

- coverage-target: 90%+ (not 100%, edge cases acceptable)
- test-first: write/update tests alongside code changes
- components: every component must have .test.tsx
- mocking: use MSW v2 handlers in test-utils/msw/handlers.ts

notes:

- This file is machine-focused. Keep it terse; update `last-updated` on edits.
- For comprehensive guidance and context, see CLAUDE.md

# AI Agent Instructions

**Choose the appropriate guidance for your AI agent:**

## For GitHub Copilot & Automated Agents

📖 **[.github/copilot-instructions.md](.github/copilot-instructions.md)**

_Machine-readable runbook with:_

- Validation gates and timeouts
- Bailout rules and error handling
- Terse operational commands
- Cost-saving loop prevention

## For Claude Code

📖 **[CLAUDE.md](CLAUDE.md)**

_Comprehensive development guidance with:_

- Test-driven development philosophy
- Architecture patterns and context
- Playwright MCP debugging workflows
- Environment setup and common issues

## Quick Reference

**All agents must follow:**

- Run `npm run lint && npm run typecheck && npm run test` for code changes
- Stop after 3 failed attempts
- Use Playwright MCP for UI debugging
- Aim for 90%+ test coverage

**Start with the appropriate file above** - they contain everything needed to work effectively on this codebase.

import type {Cookie, Page} from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json')

function loadStoredCookies(): Cookie[] {
  const raw = fs.readFileSync(STORAGE_STATE_PATH, 'utf-8')
  const state = JSON.parse(raw) as {cookies: Cookie[]}
  return state.cookies
}

/**
 * Pre-authenticates the page's context via the stored test-user session
 * (see instant-nav.rig.md), without navigating. Required for instant()
 * initial-load tests: a login flow that calls page.goto() itself would
 * complete outside the lock and produce a false RED.
 */
export async function injectTestUserSession(page: Page): Promise<void> {
  await page.context().addCookies(loadStoredCookies())
}

/**
 * Soft-nav variant: same cookie-injection mechanism as
 * injectTestUserSession. This project authenticates by reusing an
 * already-established Reddit OAuth session (captured once via
 * agent-browser), not a scripted login form, so there's no separate
 * browser-driven flow here.
 */
export async function logIntoTestAccount(page: Page): Promise<void> {
  await injectTestUserSession(page)
}

/** Resolve a path against the configured BASE_URL. */
export function testUrl(pathname: string): string {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  return new URL(pathname, base).toString()
}

import 'server-only'
import { cookies } from 'next/headers'

/*
 * Device preferences (design §8.8): one-year cookies, independent of the
 * Reddit account, so they survive sign-out and browser restarts.
 */

export const THEME_COOKIE = 'rv_theme'
export const BLUR_COOKIE = 'rv_blur_nsfw'
export const SETTINGS_MAX_AGE = 60 * 60 * 24 * 365

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export type Settings = { theme: Theme; blurNsfw: boolean }

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value)
}

/** Reads request cookies, so call it only inside a Suspense-wrapped component. */
export async function getSettings(): Promise<Settings> {
  const jar = await cookies()
  const theme = jar.get(THEME_COOKIE)?.value
  return {
    theme: isTheme(theme) ? theme : 'system',
    // Absent means on (design §8.8).
    blurNsfw: jar.get(BLUR_COOKIE)?.value !== 'off',
  }
}

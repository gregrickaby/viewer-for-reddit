'use server'

import { refresh } from 'next/cache'
import { cookies } from 'next/headers'
import { invalid } from '@/lib/actions/run-action'
import type { ActionResult } from '@/lib/actions/result'
import { BLUR_COOKIE, SETTINGS_MAX_AGE, THEME_COOKIE, isTheme } from '@/lib/settings'

const cookieOptions = {
  path: '/',
  maxAge: SETTINGS_MAX_AGE,
  sameSite: 'lax',
  secure: true,
} as const

/**
 * The no-JS path for the theme. With JavaScript, `ThemeToggle` applies the
 * theme and writes the cookie itself, so nothing needs re-rendering.
 */
export async function setTheme(formData: FormData): Promise<ActionResult> {
  const theme = formData.get('theme')
  if (!isTheme(theme)) return invalid()
  // Not httpOnly: the no-flash head script reads it (design §8.8).
  ;(await cookies()).set(THEME_COOKIE, theme, { ...cookieOptions, httpOnly: false })
  return { ok: true, data: undefined }
}

/** Media blur is applied by the server, so the page re-renders. */
export async function setBlurNsfw(formData: FormData): Promise<ActionResult<{ blur: boolean }>> {
  const blur = formData.get('blur')
  if (blur !== 'on' && blur !== 'off') return invalid()
  ;(await cookies()).set(BLUR_COOKIE, blur, { ...cookieOptions, httpOnly: true })
  refresh()
  return { ok: true, data: { blur: blur === 'on' } }
}

'use client'

import { type ChangeEvent, useState } from 'react'
import { setTheme } from '@/app/actions/settings'
import type { Theme } from '@/lib/settings'
import styles from './theme-toggle.module.css'
import { formAction } from '@/lib/actions/form-action'

const OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * System / Light / Dark (design §8.8). With JS it applies the theme at once,
 * crossfading with a view transition, and writes the cookie itself. Without
 * JS it's a form post; the server sets the cookie for the next load.
 */
export function ThemeToggle({ theme }: { theme: Theme }) {
  const [current, setCurrent] = useState(theme)

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.currentTarget.value as Theme
    setCurrent(next)
    const apply = () => {
      document.documentElement.dataset.theme = next
      document.cookie = `rv_theme=${next}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax; Secure`
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduced) document.startViewTransition(apply)
    else apply()
  }

  return (
    <form action={formAction(setTheme)}>
      <fieldset className={styles.root}>
        <legend className="visually-hidden">Theme</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={current === option.value}
              onChange={onChange}
              className={styles.input}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <noscript>
        <button type="submit" className={styles.submit}>
          Apply theme
        </button>
      </noscript>
    </form>
  )
}

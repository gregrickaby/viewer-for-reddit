'use client'

import { type FormEvent, useState, useSyncExternalStore } from 'react'
import { setTheme } from '@/app/actions/settings'
import { formAction } from '@/lib/actions/form-action'
import type { Theme } from '@/lib/settings'
import { SwitchRow } from './switch-row'
import styles from './theme-toggle.module.css'

const ONE_YEAR = 60 * 60 * 24 * 365
const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToDevice(onChange: () => void) {
  const query = matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * "Dark mode" (design §8.8): a switch that shows what you see now. Until it is
 * touched the site follows the device, and the switch mirrors the device; once
 * flipped, the choice is remembered, and "Match my device" undoes it. With JS
 * the theme applies at once, crossfading with a view transition, and the
 * cookie is written here. Without JS each button is a form post.
 */
export function ThemeToggle({ theme }: { theme: Theme }) {
  const [current, setCurrent] = useState(theme)
  const deviceIsDark = useSyncExternalStore(
    subscribeToDevice,
    () => matchMedia(DARK_QUERY).matches,
    () => false,
  )
  const dark = current === 'system' ? deviceIsDark : current === 'dark'

  function apply(next: Theme) {
    setCurrent(next)
    const write = () => {
      document.documentElement.dataset.theme = next
      document.cookie = `rv_theme=${next}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax; Secure`
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduced) document.startViewTransition(write)
    else write()
  }

  function submit(next: Theme) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      apply(next)
    }
  }

  return (
    <div className={styles.root}>
      <form action={formAction(setTheme)} onSubmit={submit(dark ? 'light' : 'dark')}>
        <input type="hidden" name="theme" value={dark ? 'light' : 'dark'} />
        <SwitchRow
          label="Dark mode"
          description={
            current === 'system' ? 'Matches your device' : dark ? 'Always dark' : 'Always light'
          }
          checked={dark}
        />
      </form>
      {current === 'system' ? null : (
        <form action={formAction(setTheme)} onSubmit={submit('system')}>
          <input type="hidden" name="theme" value="system" />
          <button type="submit" className={styles.match}>
            Match my device
          </button>
        </form>
      )}
    </div>
  )
}

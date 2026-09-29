'use client'

import { useOptimistic, useState } from 'react'
import { setBlurNsfw } from '@/app/actions/settings'
import styles from './setting-switch.module.css'
import { useEnhancedForm } from './use-enhanced-form'

/**
 * "Blur NSFW media" (design §8.8). The switch flips at once; the action sets
 * the cookie and re-renders the page with or without the reveal wrappers.
 */
export function SettingSwitch({ checked, label }: { checked: boolean; label: string }) {
  const [confirmed, setConfirmed] = useState(checked)
  const [view, setView] = useOptimistic(confirmed)

  const { formProps, error } = useEnhancedForm(setBlurNsfw, {
    optimistic: (formData) => setView(formData.get('blur') === 'on'),
    settled: (result) => {
      if (result.ok) setConfirmed(result.data.blur)
    },
  })

  return (
    <form {...formProps} className={styles.root}>
      <input type="hidden" name="blur" value={view ? 'off' : 'on'} />
      <button type="submit" role="switch" aria-checked={view} className={styles.switch}>
        <span className={styles.label}>{label}</span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

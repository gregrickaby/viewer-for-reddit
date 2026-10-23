'use client'

import { useOptimistic, useState } from 'react'

import { setSaved } from '@/app/actions/things'

import styles from './save-button.module.css'
import { useEnhancedForm } from './use-enhanced-form'

/** Save and unsave: the same optimistic pattern as voting, with a boolean. */
export function SaveButton({ fullname, saved }: { fullname: string; saved: boolean }) {
  const [confirmed, setConfirmed] = useState(saved)
  const [view, setView] = useOptimistic(confirmed)

  const { formProps, error } = useEnhancedForm(setSaved, {
    optimistic: (formData) => setView(formData.get('saved') === 'true'),
    settled: (result) => {
      if (result.ok) setConfirmed(result.data.saved)
    },
  })

  return (
    <form {...formProps} className={styles.root}>
      <input name="id" type="hidden" value={fullname} />
      <input name="saved" type="hidden" value={String(!view)} />
      <button aria-pressed={view} className={styles.button} type="submit">
        <svg aria-hidden="true" focusable="false" height="16" viewBox="0 0 20 20" width="16">
          <path d="M5 3h10v14l-5-4-5 4z" />
        </svg>
        {view ? 'Saved' : 'Save'}
      </button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

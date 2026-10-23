'use client'

import { useOptimistic, useState } from 'react'

import { setMembership } from '@/app/actions/multis'

import styles from './membership-toggle.module.css'
import { useEnhancedForm } from './use-enhanced-form'

export interface MembershipToggleProps {
  /** The multi's URL name. */
  multi: string
  subreddit: string
  member: boolean
  /** What the checkmark row says, e.g. the multi's display name. */
  label: string
  /** `check`: a checkmark row (menus). `button`: an Add/Remove button (editor rows). */
  variant?: 'check' | 'button'
}

/**
 * Adds or removes one subreddit from a multi. The checkmark or
 * button flips at once; the action re-renders, so lists settle on Reddit's state.
 */
export function MembershipToggle({
  multi,
  subreddit,
  member,
  label,
  variant = 'check',
}: MembershipToggleProps) {
  const [confirmed, setConfirmed] = useState(member)
  const [view, setView] = useOptimistic(confirmed)

  const { formProps, isPending, error } = useEnhancedForm(setMembership, {
    transitionType: 'list-change',
    optimistic: (formData) => setView(formData.get('member') === 'true'),
    settled: (result) => {
      if (result.ok) setConfirmed(result.data.member)
    },
  })

  return (
    <form {...formProps} className={styles.root}>
      <input name="multi" type="hidden" value={multi} />
      <input name="subreddit" type="hidden" value={subreddit} />
      <input name="member" type="hidden" value={String(!view)} />
      {variant === 'check' ? (
        <button aria-busy={isPending} aria-pressed={view} className={styles.check} type="submit">
          <span aria-hidden="true" className={styles.mark}>
            {view ? '✓' : ''}
          </span>
          {label}
        </button>
      ) : (
        <button
          aria-busy={isPending}
          aria-label={`${view ? 'Remove' : 'Add'} r/${subreddit} ${view ? 'from' : 'to'} ${label}`}
          className={`${styles.button} ${view ? styles.remove : styles.add}`}
          type="submit"
        >
          {view ? 'Remove' : 'Add'}
        </button>
      )}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

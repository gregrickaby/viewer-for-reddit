'use client'

import { useOptimistic, useState } from 'react'
import { setMembership } from '@/app/actions/multis'
import styles from './membership-toggle.module.css'
import { useEnhancedForm } from './use-enhanced-form'

export type MembershipToggleProps = {
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
 * Adds or removes one subreddit from a multi (design §8.6). The checkmark or
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
      <input type="hidden" name="multi" value={multi} />
      <input type="hidden" name="subreddit" value={subreddit} />
      <input type="hidden" name="member" value={String(!view)} />
      {variant === 'check' ? (
        <button type="submit" className={styles.check} aria-pressed={view} aria-busy={isPending}>
          <span className={styles.mark} aria-hidden="true">
            {view ? '✓' : ''}
          </span>
          {label}
        </button>
      ) : (
        <button
          type="submit"
          className={`${styles.button} ${view ? styles.remove : styles.add}`}
          aria-label={`${view ? 'Remove' : 'Add'} r/${subreddit} ${view ? 'from' : 'to'} ${label}`}
          aria-busy={isPending}
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

'use client'

import { useId, useOptimistic, useState } from 'react'
import { setSubscription } from '@/app/actions/subscriptions'
import { Button } from '@/components/ui/button'
import styles from './subscribe-button.module.css'
import { useEnhancedForm } from './use-enhanced-form'

export type SubscribeButtonProps = {
  /** A subreddit name, or a username for `kind: 'user'`. */
  name: string
  kind: 'community' | 'user'
  subscribed: boolean
  /** On the manage page, leaving asks first (design §10.3). */
  confirmLeave?: boolean
}

/**
 * Join/Joined, or Follow/Following (design §8.6). Flips at once; the action
 * re-renders the page, so the sidebar and every other button settle too.
 */
export function SubscribeButton({
  name,
  kind,
  subscribed,
  confirmLeave = false,
}: SubscribeButtonProps) {
  const [confirmed, setConfirmed] = useState(subscribed)
  const [view, setView] = useOptimistic(confirmed)
  const confirmId = useId()

  const { formProps, isPending, error } = useEnhancedForm(setSubscription, {
    transitionType: 'list-change',
    optimistic: (formData) => {
      document.getElementById(confirmId)?.hidePopover()
      setView(formData.get('subscribe') === 'true')
    },
    settled: (result) => {
      if (result.ok) setConfirmed(result.data.subscribed)
    },
  })

  const label = kind === 'user' ? `u/${name}` : `r/${name}`
  const [on, off] = kind === 'user' ? ['Following', 'Follow'] : ['Joined', 'Join']

  return (
    <form {...formProps} className={styles.root}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="subscribe" value={String(!view)} />
      {view && confirmLeave ? (
        <>
          <button
            type="button"
            className={`${styles.button} ${styles.on}`}
            popoverTarget={confirmId}
          >
            {on}
          </button>
          <div
            id={confirmId}
            popover="auto"
            className={styles.confirm}
            role="dialog"
            aria-label={`Leave ${label}`}
          >
            <p>
              {kind === 'user' ? 'Unfollow' : 'Leave'} {label}?
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                size="sm"
                popoverTarget={confirmId}
                popoverTargetAction="hide"
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm">
                {kind === 'user' ? 'Unfollow' : 'Leave'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <button
          type="submit"
          className={`${styles.button} ${view ? styles.on : styles.off}`}
          aria-pressed={view}
          aria-label={`${view ? on : off} ${label}`}
          aria-busy={isPending}
        >
          {view ? on : off}
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

'use client'

import { useId, useOptimistic, useState } from 'react'

import { setSubscription } from '@/app/actions/subscriptions'
import { Button } from '@/components/ui/button'

import styles from './subscribe-button.module.css'
import { useEnhancedForm } from './use-enhanced-form'

export interface SubscribeButtonProps {
  /** A subreddit name, or a username for `kind: 'user'`. */
  name: string
  kind: 'community' | 'user'
  subscribed: boolean
  /** On the manage page, leaving asks first. */
  confirmLeave?: boolean
}

/**
 * Join/Joined, or Follow/Following. Flips at once; the action
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
      <input name="name" type="hidden" value={name} />
      <input name="kind" type="hidden" value={kind} />
      <input name="subscribe" type="hidden" value={String(!view)} />
      {view && confirmLeave ? (
        <>
          <button
            className={`${styles.button} ${styles.on}`}
            popoverTarget={confirmId}
            type="button"
          >
            {on}
          </button>
          <div
            aria-label={`Leave ${label}`}
            className={styles.confirm}
            id={confirmId}
            popover="auto"
            role="dialog"
          >
            <p>
              {kind === 'user' ? 'Unfollow' : 'Leave'} {label}?
            </p>
            <div className={styles.confirmActions}>
              <Button
                popoverTarget={confirmId}
                popoverTargetAction="hide"
                size="sm"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" variant="danger">
                {kind === 'user' ? 'Unfollow' : 'Leave'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <button
          aria-busy={isPending}
          aria-label={`${view ? on : off} ${label}`}
          aria-pressed={view}
          className={`${styles.button} ${view ? styles.on : styles.off}`}
          type="submit"
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

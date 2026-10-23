import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'

import { MembershipToggle } from '@/components/islands/membership-toggle'
import type { MultiView } from '@/lib/view-models'

import styles from './add-to-multi-menu.module.css'

/**
 * "+ Multi": a popover listing the viewer's editable multis, each with a
 * checkmark for whether it includes this subreddit.
 */
export function AddToMultiMenu({ subreddit, multis }: { subreddit: string; multis: MultiView[] }) {
  const id = useId()
  const editable = multis.filter((multi) => multi.canEdit)
  const lower = subreddit.toLowerCase()

  return (
    <div className={styles.root}>
      <button
        aria-label={`Add r/${subreddit} to a multireddit`}
        className={styles.trigger}
        popoverTarget={id}
        type="button"
      >
        + Multi <span aria-hidden="true">▾</span>
      </button>
      <div className={styles.menu} id={id} popover="auto">
        <p className={styles.heading}>Add r/{subreddit} to…</p>
        {editable.length > 0 ? (
          <ul className={styles.list} role="list">
            {editable.map((multi) => (
              <li key={multi.name}>
                <MembershipToggle
                  key={String(multi.subreddits.some((name) => name.toLowerCase() === lower))}
                  label={multi.displayName}
                  member={multi.subreddits.some((name) => name.toLowerCase() === lower)}
                  multi={multi.name}
                  subreddit={subreddit}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>You don&apos;t have any multireddits yet.</p>
        )}
        <Link className={styles.manage} href={'/multis' as Route}>
          Manage multireddits →
        </Link>
      </div>
    </div>
  )
}

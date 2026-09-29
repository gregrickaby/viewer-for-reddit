import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'
import { MembershipToggle } from '@/components/islands/membership-toggle'
import type { MultiView } from '@/lib/view-models'
import styles from './add-to-multi-menu.module.css'

/**
 * "+ Multi": a popover listing the viewer's editable multis, each with a
 * checkmark for whether it includes this subreddit (design §10.2).
 */
export function AddToMultiMenu({ subreddit, multis }: { subreddit: string; multis: MultiView[] }) {
  const id = useId()
  const editable = multis.filter((multi) => multi.canEdit)
  const lower = subreddit.toLowerCase()

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget={id}
        aria-label={`Add r/${subreddit} to a multireddit`}
      >
        + Multi <span aria-hidden="true">▾</span>
      </button>
      <div id={id} popover="auto" className={styles.menu}>
        <p className={styles.heading}>Add r/{subreddit} to…</p>
        {editable.length > 0 ? (
          <ul role="list" className={styles.list}>
            {editable.map((multi) => (
              <li key={multi.name}>
                <MembershipToggle
                  key={String(multi.subreddits.some((name) => name.toLowerCase() === lower))}
                  multi={multi.name}
                  subreddit={subreddit}
                  member={multi.subreddits.some((name) => name.toLowerCase() === lower)}
                  label={multi.displayName}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>You don’t have any multireddits yet.</p>
        )}
        <Link href={'/multis' as Route} className={styles.manage}>
          Manage multireddits →
        </Link>
      </div>
    </div>
  )
}

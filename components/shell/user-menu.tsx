/* eslint-disable @next/next/no-img-element -- a Reddit-hosted avatar; see components/media/post-media.tsx */
import type { Route } from 'next'
import Link from 'next/link'

import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { getUsername } from '@/lib/auth/session'
import { getMe } from '@/lib/reddit/reads'

import styles from './user-menu.module.css'

/** The avatar, or null when Reddit can't be reached: the menu still works without it. */
async function avatar(): Promise<string | null> {
  try {
    return (await getMe()).icon
  } catch {
    return null
  }
}

/**
 * The account menu: a native popover, so it needs no
 * JavaScript. It reads the session, so it streams in behind a Suspense boundary.
 */
export async function UserMenu() {
  const username = await getUsername()
  if (!username) return null
  const icon = await avatar()

  return (
    <div className={styles.root}>
      <button
        aria-label={`Account menu for u/${username}`}
        className={styles.trigger}
        popoverTarget="user-menu"
        type="button"
      >
        {icon ? (
          <img alt="" className={styles.avatar} height={32} src={icon} width={32} />
        ) : (
          <span aria-hidden="true" className={styles.avatarFallback}>
            {username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={styles.name}>u/{username}</span>
      </button>

      <div className={styles.menu} id="user-menu" popover="auto">
        <nav aria-label="Account" className={styles.links}>
          <Link className={styles.link} href={`/user/${username}` as Route}>
            Profile
          </Link>
          <Link className={styles.link} href={'/saved' as Route}>
            Saved
          </Link>
          <Link className={styles.link} href={'/multis' as Route}>
            Multireddits
          </Link>
          <Link className={styles.link} href={'/subreddits' as Route}>
            Subscriptions
          </Link>
          <Link className={styles.link} href={'/settings' as Route}>
            Settings
          </Link>
        </nav>
        <form action={signOut} className={styles.signOut}>
          <Button size="sm" type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}

export function UserMenuSkeleton() {
  return (
    <div aria-hidden="true" className={styles.root}>
      <span className={`skeleton ${styles.avatarSkeleton}`} />
      <span className={`skeleton ${styles.nameSkeleton}`} />
    </div>
  )
}

/* eslint-disable @next/next/no-img-element -- a Reddit-hosted avatar; see components/media/post-media.tsx */
import type { Route } from 'next'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { SettingSwitch } from '@/components/islands/setting-switch'
import { ThemeToggle } from '@/components/islands/theme-toggle'
import { Button } from '@/components/ui/button'
import { getUsername } from '@/lib/auth/session'
import { getMe } from '@/lib/reddit/reads'
import { getSettings } from '@/lib/settings'
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
 * The account menu (design §8.8, §10.1): a native popover, so it needs no
 * JavaScript. It reads the session, so it streams in behind a Suspense boundary.
 */
export async function UserMenu() {
  const username = await getUsername()
  if (!username) return null
  const [icon, settings] = await Promise.all([avatar(), getSettings()])

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget="user-menu"
        aria-label={`Account menu for u/${username}`}
      >
        {icon ? (
          <img className={styles.avatar} src={icon} alt="" width={32} height={32} />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={styles.name}>u/{username}</span>
      </button>

      <div id="user-menu" popover="auto" className={styles.menu}>
        <nav aria-label="Account" className={styles.links}>
          <Link href={`/user/${username}` as Route} className={styles.link}>
            Profile
          </Link>
          <Link href={'/saved' as Route} className={styles.link}>
            Saved
          </Link>
          <Link href={'/multis' as Route} className={styles.link}>
            Multireddits
          </Link>
          <Link href={'/subreddits' as Route} className={styles.link}>
            Subscriptions
          </Link>
          <Link href={'/settings' as Route} className={styles.link}>
            Settings
          </Link>
        </nav>
        <div className={styles.settings}>
          <ThemeToggle theme={settings.theme} />
          <SettingSwitch checked={settings.blurNsfw} label="Blur NSFW media" />
        </div>
        <form action={signOut} className={styles.signOut}>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}

export function UserMenuSkeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={`skeleton ${styles.avatarSkeleton}`} />
      <span className={`skeleton ${styles.nameSkeleton}`} />
    </div>
  )
}

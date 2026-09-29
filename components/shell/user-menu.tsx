import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { getUsername } from '@/lib/auth/session'
import styles from './user-menu.module.css'

/** Reads the session, so it streams in behind a Suspense boundary. */
export async function UserMenu() {
  const username = await getUsername()
  if (!username) return null

  return (
    <div className={styles.root}>
      <span className={styles.name}>u/{username}</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  )
}

export function UserMenuSkeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={`skeleton ${styles.nameSkeleton}`} />
    </div>
  )
}

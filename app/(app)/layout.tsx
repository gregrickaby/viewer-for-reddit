import Link from 'next/link'
import { Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { UserMenu, UserMenuSkeleton } from '@/components/shell/user-menu'
import styles from './layout.module.css'

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/home" className={styles.brand} aria-label="Reddit Viewer home">
          <Logo size={32} withWordmark />
        </Link>
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { PopoverDismiss } from '@/components/islands/popover-dismiss'
import { SectionError } from '@/components/islands/section-error'
import {
  SidebarFeeds,
  SidebarLists,
  SidebarSiteLinks,
  SidebarSkeleton,
} from '@/components/shell/sidebar'
import { SettingsMenu, SettingsMenuSkeleton } from '@/components/shell/settings-menu'
import { UserMenu, UserMenuSkeleton } from '@/components/shell/user-menu'
import { SITE } from '@/lib/site'
import styles from './layout.module.css'

/** Signed-in pages are one person's Reddit: nothing here belongs in a search index. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * The signed-in shell (design §10.1). The header and nav frame prerender;
 * the user menu and sidebar lists stream in behind their own boundaries.
 * The sidebar is one element: a static column on wide screens and a
 * `popover` drawer on narrow ones, so it needs no JavaScript either way.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuButton}
          popoverTarget="app-nav"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        {/* The name beside the bar is decoration: the logo inside the bar is the home link. */}
        <Link href="/home" className={styles.brand} aria-hidden="true" tabIndex={-1}>
          <Logo mark={false} withWordmark="wide" />
        </Link>
        <form action="/search" method="get" role="search" className={styles.search}>
          <label htmlFor="site-search" className="visually-hidden">
            Search subreddits
          </label>
          <div className={styles.field}>
            <Link href="/home" className={styles.searchLogo} aria-label={`${SITE.name} home`}>
              <Logo size={28} />
            </Link>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search subreddits…"
              className={styles.searchInput}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </form>
        <Suspense fallback={<SettingsMenuSkeleton />}>
          <SettingsMenu />
        </Suspense>
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </header>

      <aside id="app-nav" popover="auto" className={styles.sidebar} aria-label="Navigation">
        <SidebarFeeds />
        <SectionError title="Couldn’t load your communities">
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarLists />
          </Suspense>
        </SectionError>
        <SidebarSiteLinks />
      </aside>

      <main className={styles.main}>{children}</main>
      <Suspense fallback={null}>
        <PopoverDismiss />
      </Suspense>
    </div>
  )
}

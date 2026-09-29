import type { Route } from 'next'
import Link from 'next/link'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import styles from './tabs.module.css'

export type Tab = { href: string; label: string; current: boolean }

/**
 * URL-state tabs (design §10.4): a `<nav>` of links, the current one marked
 * with `aria-current`. Each link carries a pending hint, so the content can
 * dim while the next tab loads.
 */
export function Tabs({ label, tabs }: { label: string; tabs: Tab[] }) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href as Route}
          className={styles.tab}
          aria-current={tab.current ? 'page' : undefined}
        >
          {tab.label}
          <LinkPendingHint />
        </Link>
      ))}
    </nav>
  )
}

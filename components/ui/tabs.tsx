import type { Route } from 'next'
import Link from 'next/link'

import { LinkPendingHint } from '@/components/islands/link-pending-hint'

import styles from './tabs.module.css'

export interface Tab {
  href: string
  label: string
  current: boolean
}

/**
 * URL-state tabs: a `<nav>` of links, the current one marked
 * with `aria-current`. Each link carries a pending hint, so the content can
 * dim while the next tab loads.
 */
export function Tabs({ label, tabs }: { label: string; tabs: Tab[] }) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      {tabs.map((tab) => (
        <Link
          aria-current={tab.current ? 'page' : undefined}
          className={styles.tab}
          href={tab.href as Route}
          key={tab.href}
        >
          {tab.label}
          <LinkPendingHint />
        </Link>
      ))}
    </nav>
  )
}

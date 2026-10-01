'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, ViewTransition, useState } from 'react'
import { SidebarIcon } from '@/components/shell/sidebar-icon'
import styles from '@/components/shell/sidebar.module.css'

/** Rows fade in and out when a subscription changes (design §8.5, list-change). */
const LIST_ENTER = { 'list-change': 'fade-in', default: 'none' }
const LIST_EXIT = { 'list-change': 'fade-out', default: 'none' }

export type SidebarItem = {
  key: string
  /** What the filter matches against. */
  name: string
  /** What the row shows. */
  label: string
  href: string
  icon: string | null
}

/** A list this short is quicker to scan than to filter. */
const FILTER_OVER = 10

type Props = {
  items: SidebarItem[]
  /** How many rows show before the filter is used. */
  limit: number
  /** Plural, for the placeholder and the messages: "communities". */
  noun: string
  /** The letter on a row without an icon. */
  fallback: string
  /** Where the full list lives, and where the form goes without JavaScript. */
  manageHref: string
  /** Fields the manage page needs to land on the same list, such as its tab. */
  manageFields?: Record<string, string>
}

/**
 * A sidebar list (design §10.1). The server renders the first `limit`; typing
 * filters all of them in place, and Enter opens the first match. Without
 * JavaScript the form submits to the manage page.
 */
export function SidebarFilter({
  items,
  limit,
  noun,
  fallback,
  manageHref,
  manageFields = {},
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? items.filter((item) => item.name.toLowerCase().includes(needle))
    : items.slice(0, limit)

  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (matches[0]) router.push(matches[0].href as Route)
  }

  return (
    <>
      {items.length > FILTER_OVER ? (
        <form action={manageHref} method="get" role="search" onSubmit={open}>
          {Object.entries(manageFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <label htmlFor={`sidebar-filter-${noun}`} className="visually-hidden">
            Filter your {noun}
          </label>
          <input
            id={`sidebar-filter-${noun}`}
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${noun}…`}
            className={styles.filter}
            autoComplete="off"
            enterKeyHint="go"
          />
        </form>
      ) : null}
      {matches.length > 0 ? (
        <ul role="list" className={styles.list}>
          {matches.map((item) => (
            <ViewTransition key={item.key} enter={LIST_ENTER} exit={LIST_EXIT} default="none">
              {' '}
              <li>
                <Link href={item.href as Route} className={styles.link}>
                  <SidebarIcon src={item.icon} fallback={fallback} />
                  <span className={styles.label}>{item.label}</span>
                </Link>
              </li>{' '}
            </ViewTransition>
          ))}
        </ul>
      ) : (
        <p className={styles.empty} role="status">
          No {noun} match “{query.trim()}”.
        </p>
      )}
      {!needle && items.length > limit ? (
        <Link
          href={`${manageHref}${manageFields.tab ? `?tab=${manageFields.tab}` : ''}` as Route}
          className={styles.more}
        >
          All {items.length} {noun} →
        </Link>
      ) : null}
    </>
  )
}

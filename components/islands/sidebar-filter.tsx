'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, ViewTransition, type FormEvent } from 'react'

import { SidebarIcon } from '@/components/shell/sidebar-icon'
import styles from '@/components/shell/sidebar.module.css'

/** Rows fade in and out when a subscription changes (list-change). */
const LIST_ENTER = { 'list-change': 'fade-in', default: 'none' }
const LIST_EXIT = { 'list-change': 'fade-out', default: 'none' }

export interface SidebarItem {
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

interface Props {
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
 * A sidebar list. The server renders the first `limit`; typing
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
        <form action={manageHref} method="get" onSubmit={open} role="search">
          {Object.entries(manageFields).map(([name, value]) => (
            <input key={name} name={name} type="hidden" value={value} />
          ))}
          <label className="visually-hidden" htmlFor={`sidebar-filter-${noun}`}>
            Filter your {noun}
          </label>
          <input
            autoComplete="off"
            className={styles.filter}
            enterKeyHint="go"
            id={`sidebar-filter-${noun}`}
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${noun}…`}
            type="search"
            value={query}
          />
        </form>
      ) : null}
      {matches.length > 0 ? (
        <ul className={styles.list} role="list">
          {matches.map((item) => (
            <ViewTransition default="none" enter={LIST_ENTER} exit={LIST_EXIT} key={item.key}>
              {' '}
              <li>
                <Link className={styles.link} href={item.href as Route}>
                  <SidebarIcon fallback={fallback} src={item.icon} />
                  <span className={styles.label}>{item.label}</span>
                </Link>
              </li>{' '}
            </ViewTransition>
          ))}
        </ul>
      ) : (
        <p className={styles.empty} role="status">
          No {noun} match &quot;{query.trim()}&quot;.
        </p>
      )}
      {!needle && items.length > limit ? (
        <Link
          className={styles.more}
          href={`${manageHref}${manageFields.tab ? `?tab=${manageFields.tab}` : ''}` as Route}
        >
          All {items.length} {noun} →
        </Link>
      ) : null}
    </>
  )
}

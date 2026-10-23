'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import { parseText, pick, SEARCH_TABS } from '@/lib/url-state'

interface Props {
  className?: string
}

/**
 * The header's search field. On the results page it shows the query and keeps
 * the tab, so searching again stays where you were. Elsewhere it is empty.
 * Its form submits to /search without JavaScript.
 */
export function SiteSearchInput({ className }: Props) {
  const searching = usePathname() === '/search'
  const params = useSearchParams()
  const q = searching ? parseText(params.get('q') ?? undefined) : ''
  const tab = searching ? pick(SEARCH_TABS, params.get('tab') ?? undefined) : 'communities'

  return (
    <>
      {tab === 'communities' ? null : <input name="tab" type="hidden" value={tab} />}
      <input
        // A new search from elsewhere replaces what was typed.
        autoComplete="off"
        className={className}
        defaultValue={q}
        enterKeyHint="search"
        id="site-search"
        key={q}
        name="q"
        placeholder="Search Reddit…"
        type="search"
      />
    </>
  )
}

/** The field before the URL is known, and for the static shell. */
export function SiteSearchFallback({ className }: Props) {
  return (
    <input
      autoComplete="off"
      className={className}
      enterKeyHint="search"
      id="site-search"
      name="q"
      placeholder="Search Reddit…"
      type="search"
    />
  )
}

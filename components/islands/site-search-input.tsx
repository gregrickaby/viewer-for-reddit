'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { SEARCH_TABS, parseText, pick } from '@/lib/url-state'

type Props = { className: string }

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
      {tab === 'communities' ? null : <input type="hidden" name="tab" value={tab} />}
      <input
        // A new search from elsewhere replaces what was typed.
        key={q}
        id="site-search"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search Reddit…"
        className={className}
        autoComplete="off"
        enterKeyHint="search"
      />
    </>
  )
}

/** The field before the URL is known, and for the static shell. */
export function SiteSearchFallback({ className }: Props) {
  return (
    <input
      id="site-search"
      name="q"
      type="search"
      placeholder="Search Reddit…"
      className={className}
      autoComplete="off"
      enterKeyHint="search"
    />
  )
}

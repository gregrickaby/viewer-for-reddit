// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const nav = { pathname: '/search', params: new URLSearchParams() }
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params,
}))

const { SiteSearchFallback, SiteSearchInput } =
  await import('@/components/islands/site-search-input')

afterEach(cleanup)

function show(pathname: string, query = '') {
  nav.pathname = pathname
  nav.params = new URLSearchParams(query)
  return render(<SiteSearchInput className="field" />)
}

describe('SiteSearchInput', () => {
  it('shows the query on the results page', () => {
    show('/search', 'q=typescript')
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('typescript')
    expect(document.querySelector('input[name="tab"]')).toBeNull()
  })

  it('keeps a non-default tab for the next search', () => {
    show('/search', 'q=spez&tab=people')
    expect(document.querySelector<HTMLInputElement>('input[name="tab"]')!.value).toBe('people')
  })

  it('is empty on other pages, even with a q in the URL', () => {
    show('/home', 'q=typescript')
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('')
  })

  it('has a plain fallback', () => {
    render(<SiteSearchFallback className="field" />)
    expect(screen.getByRole('searchbox').getAttribute('name')).toBe('q')
  })
})

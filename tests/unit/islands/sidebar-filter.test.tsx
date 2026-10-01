// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const { SidebarFilter } = await import('@/components/islands/sidebar-filter')

afterEach(() => {
  cleanup()
  push.mockClear()
})

function communities(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    key: `t5_${i}`,
    name: `Sub${i}`,
    label: `r/Sub${i}`,
    href: `/r/Sub${i}`,
    icon: null,
  }))
}

describe('SidebarFilter', () => {
  it('keeps the tab when it filters people without JavaScript', () => {
    render(
      <SidebarFilter
        noun="people"
        fallback="u"
        manageHref="/subreddits"
        manageFields={{ tab: 'people' }}
        items={communities(60)}
        limit={50}
      />,
    )
    expect(screen.getByRole('search').querySelector('input[name="tab"]')).toHaveProperty(
      'value',
      'people',
    )
    expect(screen.getByRole('link', { name: 'All 60 people →' }).getAttribute('href')).toBe(
      '/subreddits?tab=people',
    )
  })

  it('lists the first few, links to the rest, and filters all of them as you type', () => {
    render(
      <SidebarFilter
        noun="communities"
        fallback="r"
        manageHref="/subreddits"
        items={communities(60)}
        limit={50}
      />,
    )
    expect(screen.getAllByRole('link', { name: /^r\/Sub/ })).toHaveLength(50)
    expect(screen.getByRole('link', { name: 'All 60 communities →' })).toBeTruthy()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' sub5' } })
    const names = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(names).toContain('/r/Sub5')
    expect(names).toContain('/r/Sub59')
    expect(names).not.toContain('/r/Sub4')
    expect(screen.queryByRole('link', { name: /^All/ })).toBeNull()
  })

  it('opens the first match on Enter', () => {
    render(
      <SidebarFilter
        noun="communities"
        fallback="r"
        manageHref="/subreddits"
        items={communities(12)}
        limit={50}
      />,
    )
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'sub1' } })
    act(() => {
      fireEvent.submit(input.closest('form')!)
    })
    expect(push).toHaveBeenCalledWith('/r/Sub1')
  })

  it('says so when nothing matches, and stays put on Enter', () => {
    render(
      <SidebarFilter
        noun="communities"
        fallback="r"
        manageHref="/subreddits"
        items={communities(12)}
        limit={50}
      />,
    )
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByRole('status').textContent).toBe('No communities match “zzz”.')
    fireEvent.submit(input.closest('form')!)
    expect(push).not.toHaveBeenCalled()
  })

  it('skips the filter for a list of ten or fewer', () => {
    render(
      <SidebarFilter
        noun="communities"
        fallback="r"
        manageHref="/subreddits"
        items={communities(10)}
        limit={50}
      />,
    )
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(10)
  })

  it('submits to the Subscriptions page without JavaScript', () => {
    render(
      <SidebarFilter
        noun="communities"
        fallback="r"
        manageHref="/subreddits"
        items={communities(12)}
        limit={50}
      />,
    )
    const form = screen.getByRole('search')
    expect(form.getAttribute('action')).toBe('/subreddits')
    expect(form.getAttribute('method')).toBe('get')
  })
})

// @vitest-environment happy-dom
import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MoreFeedRequest } from '@/lib/feed-more'

const loadMoreFeed = vi.fn()
vi.mock('@/app/actions/feed', () => ({ loadMoreFeed }))

type Observer = { callback: IntersectionObserverCallback; disconnected: boolean }
const observers: Observer[] = []
class FakeObserver {
  observer: Observer
  constructor(callback: IntersectionObserverCallback) {
    this.observer = { callback, disconnected: false }
    observers.push(this.observer)
  }
  observe() {}
  disconnect() {
    this.observer.disconnected = true
  }
}

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onNavigate,
  }: {
    href: string
    children: ReactNode
    onNavigate?: () => void
  }) => (
    <a href={href} onClick={onNavigate}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}))

const { InfiniteFeed, MAX_PAGES } = await import('@/components/islands/infinite-feed')

const request: MoreFeedRequest = {
  source: { type: 'home' },
  sort: 'best',
  t: 'week',
  after: 't3_a',
  count: 25,
  showSubreddit: true,
}

function Feed() {
  return <InfiniteFeed request={request} base="/r/pics" defaultSort="best" />
}

/** Scrolls the sentinel into range on the newest live observer. */
async function scrollToEnd() {
  const live = observers.filter((observer) => !observer.disconnected).at(-1)!
  await act(async () =>
    live.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  )
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})
afterEach(() => {
  cleanup()
  loadMoreFeed.mockReset()
  vi.unstubAllGlobals()
})

describe('InfiniteFeed', () => {
  it('waits until the sentinel is near, then appends the server-rendered page', async () => {
    loadMoreFeed.mockResolvedValue({
      ok: true,
      data: { items: <li>second page</li>, after: 't3_b' },
    })
    render(<Feed />)
    expect(loadMoreFeed).not.toHaveBeenCalled()

    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenCalledWith({ ...request, after: 't3_a', count: 25 })
    expect(screen.getByText('second page')).toBeTruthy()

    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenLastCalledWith({ ...request, after: 't3_b', count: 50 })
  })

  it('ignores an intersection that has left the range', async () => {
    render(<Feed />)
    await act(async () =>
      observers[0]!.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(loadMoreFeed).not.toHaveBeenCalled()
  })

  it('says when the feed ends', async () => {
    loadMoreFeed.mockResolvedValue({ ok: true, data: { items: <li>last</li>, after: null } })
    render(<Feed />)
    await scrollToEnd()
    expect(screen.getByText('You’ve reached the end.')).toBeTruthy()
  })

  it('shows a loading note while a page is on its way', async () => {
    loadMoreFeed.mockReturnValue(new Promise(() => {}))
    render(<Feed />)
    await scrollToEnd()
    expect(screen.getByRole('status').textContent).toBe('Loading more posts…')
  })

  it('offers a retry when a page fails, and tries the same cursor again', async () => {
    loadMoreFeed.mockResolvedValueOnce({ ok: false, error: { code: 'UNKNOWN', message: 'x' } })
    loadMoreFeed.mockResolvedValueOnce({ ok: true, data: { items: <li>back</li>, after: null } })
    render(<Feed />)
    await scrollToEnd()
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load more posts.')

    await act(async () => screen.getByRole('button', { name: 'Try again' }).click())
    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenCalledTimes(2)
    expect(loadMoreFeed).toHaveBeenLastCalledWith({ ...request, after: 't3_a', count: 25 })
    expect(screen.getByText('back')).toBeTruthy()
  })

  it(`hands off to a real next page after ${MAX_PAGES} pages`, async () => {
    let page = 0
    loadMoreFeed.mockImplementation(async () => {
      page += 1
      return { ok: true, data: { items: <li>page {page}</li>, after: `t3_p${page}` } }
    })
    render(<Feed />)
    for (let index = 0; index < MAX_PAGES; index += 1) await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenCalledTimes(MAX_PAGES)
    expect(observers.every((observer) => observer.disconnected)).toBe(true)

    const next = screen.getByRole('link', { name: 'Next page →' })
    expect(next.getAttribute('href')).toBe(`/r/pics?after=t3_p${MAX_PAGES}&count=200`)
    expect(screen.queryByRole('status')).toBeNull()

    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    fireEvent.click(next)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })
})

// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react'
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

const { InfiniteFeed } = await import('@/components/islands/infinite-feed')

const request: MoreFeedRequest = {
  source: { type: 'home' },
  sort: 'best',
  t: 'week',
  after: 't3_a',
  count: 25,
  showSubreddit: true,
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
})

describe('InfiniteFeed', () => {
  it('waits until the sentinel is near, then appends the server-rendered page', async () => {
    loadMoreFeed.mockResolvedValue({
      ok: true,
      data: { items: <li>second page</li>, after: 't3_b' },
    })
    render(<InfiniteFeed request={request} />)
    expect(loadMoreFeed).not.toHaveBeenCalled()

    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenCalledWith({ ...request, after: 't3_a', count: 25 })
    expect(screen.getByText('second page')).toBeTruthy()

    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenLastCalledWith({ ...request, after: 't3_b', count: 50 })
  })

  it('ignores an intersection that has left the range', async () => {
    render(<InfiniteFeed request={request} />)
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
    render(<InfiniteFeed request={request} />)
    await scrollToEnd()
    expect(screen.getByText('You’ve reached the end.')).toBeTruthy()
  })

  it('shows a loading note while a page is on its way', async () => {
    loadMoreFeed.mockReturnValue(new Promise(() => {}))
    render(<InfiniteFeed request={request} />)
    await scrollToEnd()
    expect(screen.getByRole('status').textContent).toBe('Loading more posts…')
  })

  it('offers a retry when a page fails, and tries the same cursor again', async () => {
    loadMoreFeed.mockResolvedValueOnce({ ok: false, error: { code: 'UNKNOWN', message: 'x' } })
    loadMoreFeed.mockResolvedValueOnce({ ok: true, data: { items: <li>back</li>, after: null } })
    render(<InfiniteFeed request={request} />)
    await scrollToEnd()
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load more posts.')

    await act(async () => screen.getByRole('button', { name: 'Try again' }).click())
    await scrollToEnd()
    expect(loadMoreFeed).toHaveBeenCalledTimes(2)
    expect(loadMoreFeed).toHaveBeenLastCalledWith({ ...request, after: 't3_a', count: 25 })
    expect(screen.getByText('back')).toBeTruthy()
  })
})

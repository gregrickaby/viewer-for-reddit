// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pollThreadLive = vi.fn()
vi.mock('@/app/actions/thread-live', () => ({ pollThreadLive }))

const { LiveBody, LiveComments, LiveCount, LiveThread, MAX_LIVE_COMMENTS, paceComments } =
  await import('@/components/islands/live-thread')

const cursor = { since: 100, seen: ['a'] }

const result = (texts: string[], extra: Record<string, unknown> = {}) => ({
  ok: true,
  data: {
    items: texts.map((text) => ({ id: text, createdUtc: 200, node: <li>{text}</li> })),
    cursor: { since: 200, seen: ['z'] },
    bodyHash: 'h2',
    body: null,
    numComments: 10,
    ...extra,
  },
})

const thread = () =>
  render(
    <LiveThread id="abc123" cursor={cursor} bodyHash="h1">
      <LiveBody>
        <p>1-0</p>
      </LiveBody>
      <LiveComments />
    </LiveThread>,
  )

const tick = (ms = 15_000) => act(() => vi.advanceTimersByTimeAsync(ms))

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  pollThreadLive.mockReset()
})

describe('LiveThread', () => {
  it('starts watching, and polls from the cursor the page rendered', async () => {
    pollThreadLive.mockResolvedValue(result([]))
    thread()
    expect(screen.getByText('Watching for new comments')).toBeTruthy()
    expect(pollThreadLive).not.toHaveBeenCalled()
    await tick()
    expect(pollThreadLive).toHaveBeenCalledWith({ id: 'abc123', cursor, bodyHash: 'h1' })
  })

  it('shows new comments, and asks from the new cursor and body hash next time', async () => {
    pollThreadLive.mockResolvedValueOnce(result(['goal!'])).mockResolvedValue(result([]))
    thread()
    await tick()
    expect(screen.getByText('goal!')).toBeTruthy()
    await tick()
    expect(pollThreadLive).toHaveBeenLastCalledWith({
      id: 'abc123',
      cursor: { since: 200, seen: ['z'] },
      bodyHash: 'h2',
    })
  })

  it(`keeps only the newest ${MAX_LIVE_COMMENTS} new comments, and says so`, async () => {
    const texts = Array.from({ length: MAX_LIVE_COMMENTS + 5 }, (_, index) => `c${index}`)
    pollThreadLive.mockResolvedValueOnce(result(texts)).mockResolvedValue(result([]))
    thread()
    await tick()
    expect(screen.queryByText(/Showing the newest/)).toBeNull()
    await tick(14_000)
    expect(screen.getAllByRole('listitem')).toHaveLength(MAX_LIVE_COMMENTS)
    // Newest first: the oldest five are the ones gone.
    expect(screen.getByText('c0')).toBeTruthy()
    expect(screen.queryByText(`c${MAX_LIVE_COMMENTS + 4}`)).toBeNull()
    expect(
      screen.getByText(
        `Showing the newest ${MAX_LIVE_COMMENTS} new comments. Reload the page to see the rest.`,
      ),
    ).toBeTruthy()
  })

  it('polls at once when the reader comes back to a slowed-down thread', async () => {
    pollThreadLive.mockResolvedValue(result([]))
    thread()
    await tick(105_000)
    expect(pollThreadLive).toHaveBeenCalledTimes(3)
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(pollThreadLive).toHaveBeenCalledTimes(4)
    // The pace restarts from the fast end: that poll was quiet, so the next is 30s away.
    await tick(29_000)
    expect(pollThreadLive).toHaveBeenCalledTimes(4)
    await tick(1_000)
    expect(pollThreadLive).toHaveBeenCalledTimes(5)
  })

  it('polls when the page is shown again, even without a visibilitychange', async () => {
    pollThreadLive.mockResolvedValue(result([]))
    thread()
    await act(async () => {
      window.dispatchEvent(new Event('pageshow'))
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    // The three events are one return.
    expect(pollThreadLive).toHaveBeenCalledTimes(1)
  })

  it('counts the comments Reddit reports, in the header and on the post', async () => {
    pollThreadLive.mockResolvedValue(result([], { numComments: 72 }))
    render(
      <LiveThread id="abc123" cursor={cursor} bodyHash="h1">
        <h2>
          <LiveCount initial={42} noun="comment" />
        </h2>
        <a href="#comments">
          <LiveCount initial={42} noun="comment" hiddenClass="narrow" />
        </a>
      </LiveThread>,
    )
    expect(screen.getByText('42 comments')).toBeTruthy()
    await tick()
    expect(screen.getByText('72 comments')).toBeTruthy()
    expect(screen.getByRole('link').textContent).toBe('72 comments')
  })

  it('swaps in an edited post body', async () => {
    pollThreadLive.mockResolvedValue(result([], { body: { node: <p>2-0</p> } }))
    thread()
    expect(screen.getByText('1-0')).toBeTruthy()
    await tick()
    expect(screen.queryByText('1-0')).toBeNull()
    expect(screen.getByText('2-0')).toBeTruthy()
  })

  it('adds comments as they arrive, even to a reader down the page', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    pollThreadLive.mockResolvedValue(result(['goal!', 'and another']))
    thread()
    await tick()
    await tick(400)
    expect(screen.getByText('goal!')).toBeTruthy()
    expect(screen.getByText('and another')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /new comment/ })).toBeNull()
  })

  it('scrolls by what was added when the browser has no scroll anchoring', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    Object.defineProperty(document.documentElement, 'style', { configurable: true, value: {} })
    let height = 40
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => height,
    })
    pollThreadLive.mockResolvedValue(result(['goal!']))
    thread()
    height = 140
    await tick()
    expect(scrollBy).toHaveBeenCalledWith(0, 100)
    delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
    delete (document.documentElement as { style?: unknown }).style
    scrollBy.mockRestore()
  })

  it('shows a poll’s comments one at a time, oldest first, at the pace they were posted', async () => {
    pollThreadLive
      .mockResolvedValueOnce(
        result([], {
          items: [
            { id: 'c', createdUtc: 210, node: <li>third</li> },
            { id: 'b', createdUtc: 205, node: <li>second</li> },
            { id: 'a', createdUtc: 200, node: <li>first</li> },
          ],
        }),
      )
      .mockResolvedValue(result([]))
    thread()
    await tick()
    expect(screen.getByText('first')).toBeTruthy()
    expect(screen.queryByText('second')).toBeNull()
    await tick(5_000)
    expect(screen.getByText('second')).toBeTruthy()
    expect(screen.queryByText('third')).toBeNull()
    await tick(5_000)
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'third',
      'second',
      'first',
    ])
  })

  it('pauses and resumes', async () => {
    pollThreadLive.mockResolvedValue(result([]))
    thread()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByText('Not watching for new comments')).toBeTruthy()
    expect(screen.queryByText('Watching for new comments')).toBeNull()
    await tick(60_000)
    expect(pollThreadLive).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    await tick()
    expect(pollThreadLive).toHaveBeenCalledTimes(1)
  })

  it('says so when Reddit keeps failing, and recovers on resume', async () => {
    pollThreadLive.mockResolvedValue({ ok: false, error: { code: 'REDDIT', message: 'no' } })
    thread()
    await tick(600_000)
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t reach Reddit')

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('outside a LiveThread', () => {
  it('shows the server-rendered body, and no comments stream', () => {
    render(
      <>
        <LiveBody>
          <p>1-0</p>
        </LiveBody>
        <LiveComments />
      </>,
    )
    expect(screen.getByText('1-0')).toBeTruthy()
    expect(screen.queryByText('Watching for new comments')).toBeNull()
  })
})

describe('paceComments', () => {
  const at = (...times: number[]) =>
    paceComments(times.map((createdUtc, index) => ({ id: String(index), createdUtc, node: null })))

  it('keeps the gaps the comments were posted with', () => {
    expect(at(100, 101, 104)).toEqual([0, 1_000, 4_000])
  })

  it('squeezes a long stretch to fit before the next poll', () => {
    expect(at(0, 30, 60)).toEqual([0, 6_000, 12_000])
  })

  it('spaces comments posted in the same second', () => {
    expect(at(100, 100, 100)).toEqual([0, 400, 800])
  })

  it('tightens the spacing so a burst still fits', () => {
    const delays = at(...Array.from({ length: 60 }, () => 100))
    expect(delays.at(-1)).toBeLessThanOrEqual(12_000)
  })

  it('handles an empty poll', () => {
    expect(at()).toEqual([])
  })
})

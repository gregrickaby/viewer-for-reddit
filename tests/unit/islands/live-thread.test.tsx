// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pollThreadLive = vi.fn()
vi.mock('@/app/actions/thread-live', () => ({ pollThreadLive }))

const { LiveBody, LiveComments, LiveCount, LiveThread } =
  await import('@/components/islands/live-thread')

const cursor = { since: 100, seen: ['a'] }

const result = (texts: string[], extra: Record<string, unknown> = {}) => ({
  ok: true,
  data: {
    items: texts.map((text) => <li key={text}>{text}</li>),
    count: texts.length,
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

  it('holds comments behind a button while the reader is down the page', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    vi.stubGlobal('scrollTo', vi.fn())
    pollThreadLive.mockResolvedValue(result(['goal!', 'and another']))
    thread()
    await tick()
    expect(screen.queryByText('goal!')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show 2 new comments' }))
    expect(screen.getByText('goal!')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /new comment/ })).toBeNull()
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

// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pollLive = vi.fn()
const loadOlderLive = vi.fn()
vi.mock('@/app/actions/live', () => ({ pollLive, loadOlderLive }))

const { LiveFeed } = await import('@/components/islands/live-feed')
const { LiveTime } = await import('@/components/islands/live-time')

const FIRST = 'LiveUpdate_362ac036-b5eb-11f1-946d-ceb77989b019'
const SECOND = 'LiveUpdate_6603ce62-b094-11f1-94e4-7ec5abe59ad0'

let hidden = false

const poll = (text: string, newest: string | null = SECOND, event: unknown = null) => ({
  ok: true,
  data: { items: <li>{text}</li>, count: text ? 1 : 0, newest, event },
})

function feed(
  props: Partial<Parameters<typeof LiveFeed>[0]> = {},
  children: ReactNode = <li>first</li>,
) {
  return render(
    <LiveFeed id="abc1234567" live viewers={4} newest={FIRST} older={null} {...props}>
      {children}
    </LiveFeed>,
  )
}

/** Advances past one poll interval and lets the action's promise settle. */
const tick = (ms = 15_000) => act(() => vi.advanceTimersByTimeAsync(ms))

beforeEach(() => {
  vi.useFakeTimers()
  hidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  pollLive.mockReset()
  loadOlderLive.mockReset()
})

describe('LiveFeed polling', () => {
  it('shows the first page and the viewer count, and does not poll before the interval', () => {
    feed()
    expect(screen.getByText('first')).toBeTruthy()
    expect(screen.getByText(/Live · 4 viewers/)).toBeTruthy()
    expect(pollLive).not.toHaveBeenCalled()
  })

  it('puts new updates above the first page and polls from the newest cursor', async () => {
    pollLive.mockResolvedValueOnce(poll('second')).mockResolvedValue(poll('', null))
    feed()
    await tick()
    expect(pollLive).toHaveBeenCalledWith({ id: 'abc1234567', before: FIRST, meta: false })
    const items = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(items).toEqual(['second', 'first'])

    await tick()
    expect(pollLive).toHaveBeenLastCalledWith({ id: 'abc1234567', before: SECOND, meta: false })
  })

  it('holds new updates behind a button while the reader is down the page', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    pollLive.mockResolvedValue(poll('second'))
    feed()
    await tick()
    expect(screen.queryByText('second')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show 1 new update' }))
    expect(screen.getByText('second')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /new update/ })).toBeNull()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('shows held updates on their own once the reader is back at the top', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    pollLive.mockResolvedValueOnce(poll('held')).mockResolvedValueOnce(poll('fresh', 'x'))
    feed()
    await tick()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    await tick()
    expect(screen.getByText('held')).toBeTruthy()
    expect(screen.getByText('fresh')).toBeTruthy()
  })

  it('re-reads the thread every fourth poll and stops when it has ended', async () => {
    pollLive.mockResolvedValue(poll('', null))
    feed()
    // Quiet polls slow down, so the first three land at 15s, 45s, and 105s.
    await tick(105_000)
    expect(pollLive.mock.calls.map(([arg]) => arg.meta)).toEqual([false, false, false])

    pollLive.mockResolvedValueOnce(poll('', null, { live: false, viewers: null }))
    await tick(60_000)
    expect(pollLive.mock.calls.at(-1)![0].meta).toBe(true)
    expect(screen.getByText('This live thread has ended.')).toBeTruthy()

    const calls = pollLive.mock.calls.length
    await tick(120_000)
    expect(pollLive).toHaveBeenCalledTimes(calls)
  })

  it('slows down while nothing arrives, and speeds up again when something does', async () => {
    pollLive.mockResolvedValue(poll('', null))
    feed()
    await tick(15_000)
    expect(pollLive).toHaveBeenCalledTimes(1)
    await tick(29_000)
    expect(pollLive).toHaveBeenCalledTimes(1)
    await tick(1_000)
    expect(pollLive).toHaveBeenCalledTimes(2)
    await tick(60_000)
    expect(pollLive).toHaveBeenCalledTimes(3)
    // At the slowest pace: one a minute, not one every 15 seconds.
    await tick(60_000)
    expect(pollLive).toHaveBeenCalledTimes(4)

    pollLive.mockResolvedValueOnce(poll('news'))
    await tick(60_000)
    expect(screen.getByText('news')).toBeTruthy()
    pollLive.mockResolvedValue(poll('', null))
    await tick(15_000)
    expect(pollLive).toHaveBeenCalledTimes(6)
  })

  it('updates the viewer count from the thread', async () => {
    pollLive.mockResolvedValue(poll('', null, { live: true, viewers: 9 }))
    feed()
    await tick(165_000)
    expect(screen.getByText(/Live · 9 viewers/)).toBeTruthy()
  })

  it('backs off after a failure, recovers, and gives up after repeated failures', async () => {
    pollLive.mockResolvedValue({ ok: false, error: { code: 'RATE_LIMITED', message: 'slow' } })
    feed()
    await tick(15_000)
    expect(pollLive).toHaveBeenCalledTimes(1)
    await tick(15_000)
    expect(pollLive).toHaveBeenCalledTimes(1)
    await tick(15_000)
    expect(pollLive).toHaveBeenCalledTimes(2)

    await tick(600_000)
    expect(pollLive).toHaveBeenCalledTimes(5)
    expect(screen.getByRole('alert').textContent).toContain('Live updates paused')
    await tick(600_000)
    expect(pollLive).toHaveBeenCalledTimes(5)
  })

  it('does not poll a tab that is hidden, and catches up when it is shown', async () => {
    pollLive.mockResolvedValue(poll('', null))
    hidden = true
    feed()
    await tick()
    expect(pollLive).not.toHaveBeenCalled()

    hidden = false
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(pollLive).toHaveBeenCalledTimes(1)
  })

  it('ignores a visibility change to hidden', async () => {
    feed()
    hidden = true
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(pollLive).not.toHaveBeenCalled()
  })

  it('does not poll a thread that has ended', async () => {
    feed({ live: false, viewers: null })
    await tick(60_000)
    expect(pollLive).not.toHaveBeenCalled()
    expect(screen.getByText('This live thread has ended.')).toBeTruthy()
  })

  it('stops polling when it unmounts', async () => {
    feed().unmount()
    await tick(60_000)
    expect(pollLive).not.toHaveBeenCalled()
  })
})

describe('LiveFeed older updates', () => {
  it('appends the next page and ends when there is no more', async () => {
    loadOlderLive.mockResolvedValue({ ok: true, data: { items: <li>older</li>, after: null } })
    feed({ live: false, older: SECOND })
    fireEvent.click(screen.getByRole('button', { name: 'Load older updates' }))
    await act(async () => {})
    expect(loadOlderLive).toHaveBeenCalledWith({ id: 'abc1234567', after: SECOND })
    expect(screen.getByText('older')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Load older updates' })).toBeNull()
    expect(screen.getByText('That’s every update.')).toBeTruthy()
  })

  it('says so when a page fails, and lets the reader try again', async () => {
    loadOlderLive.mockResolvedValueOnce({ ok: false, error: { code: 'REDDIT', message: 'no' } })
    feed({ live: false, older: SECOND })
    fireEvent.click(screen.getByRole('button', { name: 'Load older updates' }))
    await act(async () => {})
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load older updates')

    loadOlderLive.mockResolvedValueOnce({ ok: true, data: { items: <li>older</li>, after: null } })
    fireEvent.click(screen.getByRole('button', { name: 'Load older updates' }))
    await act(async () => {})
    expect(screen.getByText('older')).toBeTruthy()
  })
})

describe('LiveTime', () => {
  it('keeps counting after the server rendered it', async () => {
    const now = 1_700_000_000_000
    render(<LiveTime utc={now / 1000 - 30} now={now} />)
    expect(screen.getByText('now')).toBeTruthy()
    await tick(30_000)
    await tick(30_000)
    expect(screen.getByText('1m')).toBeTruthy()
  })
})

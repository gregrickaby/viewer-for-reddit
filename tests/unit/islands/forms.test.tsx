// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/lib/actions/result'

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const pending = {
  vote: deferred<ActionResult<{ likes: number }>>(),
  save: deferred<ActionResult<{ saved: boolean }>>(),
  blur: deferred<ActionResult<{ blur: boolean }>>(),
}
type Action<T> = (formData: FormData) => Promise<ActionResult<T>>
const vote = vi.fn<Action<{ likes: number }>>(() => pending.vote.promise)
const setSaved = vi.fn<Action<{ saved: boolean }>>(() => pending.save.promise)
const setBlurNsfw = vi.fn<Action<{ blur: boolean }>>(() => pending.blur.promise)
vi.mock('@/app/actions/things', () => ({ vote, setSaved }))
vi.mock('@/app/actions/settings', () => ({ setBlurNsfw, setTheme: vi.fn() }))

const { VoteButtons, applyVote } = await import('@/components/islands/vote-buttons')
const { SaveButton } = await import('@/components/islands/save-button')
const { SettingSwitch } = await import('@/components/islands/setting-switch')

beforeEach(() => {
  pending.vote = deferred()
  pending.save = deferred()
  pending.blur = deferred()
  vote.mockClear()
  setSaved.mockClear()
  setBlurNsfw.mockClear()
})
afterEach(cleanup)

const failure = {
  ok: false as const,
  error: { code: 'REDDIT' as const, message: 'This thread is locked.' },
}

describe('applyVote', () => {
  it('sets, switches, and clears votes, moving the score by the difference', () => {
    expect(applyVote({ likes: 0, score: 10 }, 1)).toEqual({ likes: 1, score: 11 })
    expect(applyVote({ likes: 1, score: 11 }, -1)).toEqual({ likes: -1, score: 9 })
    expect(applyVote({ likes: -1, score: 9 }, -1)).toEqual({ likes: 0, score: 10 })
  })
})

describe('VoteButtons', () => {
  const renderVote = (hideScore = false) =>
    render(<VoteButtons fullname="t3_abc" likes={0} score={10} hideScore={hideScore} noun="post" />)
  const up = () => screen.getByRole('button', { name: /^Upvote/ })
  const down = () => screen.getByRole('button', { name: /^Downvote/ })

  it('shows the vote at once and keeps it when Reddit agrees', async () => {
    renderVote()
    await act(async () => fireEvent.click(up()))
    expect(up().getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('11')).toBeTruthy()
    const sent = vote.mock.calls[0]![0]
    expect(Object.fromEntries(sent)).toEqual({ id: 't3_abc', current: '0', target: '1' })

    await act(async () => pending.vote.resolve({ ok: true, data: { likes: 1 } }))
    expect(up().getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('11')).toBeTruthy()
  })

  it('rolls back and explains when Reddit refuses', async () => {
    renderVote()
    await act(async () => fireEvent.click(down()))
    expect(screen.getByText('9')).toBeTruthy()
    await act(async () => pending.vote.resolve(failure))
    expect(down().getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('This thread is locked.')
  })

  it('hides the score when Reddit does', () => {
    renderVote(true)
    expect(screen.getByText('•')).toBeTruthy()
    expect(up().getAttribute('aria-label')).toBe('Upvote post, score hidden')
  })
})

describe('SaveButton', () => {
  it('toggles at once and confirms', async () => {
    render(<SaveButton fullname="t3_abc" saved={false} />)
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('button').textContent).toContain('Saved')
    expect(Object.fromEntries(setSaved.mock.calls[0]![0])).toEqual({ id: 't3_abc', saved: 'true' })
    await act(async () => pending.save.resolve({ ok: true, data: { saved: true } }))
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('rolls back on failure', async () => {
    render(<SaveButton fullname="t3_abc" saved />)
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('button').textContent).toContain('Save')
    await act(async () => pending.save.resolve(failure))
    expect(screen.getByRole('button').textContent).toContain('Saved')
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

describe('SettingSwitch', () => {
  it('flips at once and confirms', async () => {
    render(<SettingSwitch checked label="Blur NSFW media" />)
    const toggle = screen.getByRole('switch')
    await act(async () => fireEvent.click(toggle))
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(Object.fromEntries(setBlurNsfw.mock.calls[0]![0])).toEqual({ blur: 'off' })
    await act(async () => pending.blur.resolve({ ok: true, data: { blur: false } }))
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  })

  it('rolls back on failure', async () => {
    render(<SettingSwitch checked={false} label="Blur NSFW media" />)
    await act(async () => fireEvent.click(screen.getByRole('switch')))
    await act(async () => pending.blur.resolve(failure))
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

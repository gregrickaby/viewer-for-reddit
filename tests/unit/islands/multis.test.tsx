// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/lib/actions/result'

type Result = ActionResult<{ subreddit: string; member: boolean }>
let resolve: (value: Result) => void = () => {}
const setMembership = vi.fn<(formData: FormData) => Promise<Result>>(
  () => new Promise<Result>((r) => (resolve = r)),
)
vi.mock('@/app/actions/multis', () => ({ setMembership }))

const { MembershipToggle } = await import('@/components/islands/membership-toggle')
const { ActionForm } = await import('@/components/islands/action-form')

beforeEach(() => {
  setMembership.mockClear()
})
afterEach(cleanup)

describe('MembershipToggle', () => {
  it('checks at once and keeps it when Reddit agrees', async () => {
    render(<MembershipToggle multi="news" subreddit="pics" member={false} label="News" />)
    const button = screen.getByRole('button', { name: /News/ })
    await act(async () => fireEvent.click(button))
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
    expect(Object.fromEntries(setMembership.mock.calls[0]![0])).toEqual({
      multi: 'news',
      subreddit: 'pics',
      member: 'true',
    })
    await act(async () => resolve({ ok: true, data: { subreddit: 'pics', member: true } }))
    expect(screen.getByRole('button').textContent).toContain('✓')
  })

  it('rolls back with the reason on failure', async () => {
    render(<MembershipToggle multi="news" subreddit="pics" member label="News" variant="button" />)
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Remove r/pics from News' })),
    )
    expect(screen.getByRole('button').textContent).toBe('Add')
    await act(async () => resolve({ ok: false, error: { code: 'REDDIT', message: 'Nope.' } }))
    expect(screen.getByRole('button').textContent).toBe('Remove')
    expect(screen.getByRole('alert').textContent).toBe('Nope.')
  })
})

describe('ActionForm', () => {
  it('shows the action’s error, then its success message', async () => {
    let next: ActionResult<unknown> = {
      ok: false,
      error: { code: 'INVALID', message: 'Give it a name.' },
    }
    const action = vi.fn(async () => next)
    render(
      <ActionForm action={action} success="Saved.">
        <button type="submit">Go</button>
      </ActionForm>,
    )
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('alert').textContent).toBe('Give it a name.')
    next = { ok: true, data: null }
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('status').textContent).toBe('Saved.')
  })

  it('shows nothing on success without a message', async () => {
    const action = vi.fn(async () => ({ ok: true as const, data: null }))
    render(
      <ActionForm action={action}>
        <button type="submit">Go</button>
      </ActionForm>,
    )
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

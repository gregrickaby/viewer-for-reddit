// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/lib/actions/result'

type Result = ActionResult<{ subscribed: boolean }>
let resolve: (value: Result) => void = () => {}
const setSubscription = vi.fn<(formData: FormData) => Promise<Result>>(
  () => new Promise<Result>((r) => (resolve = r)),
)
vi.mock('@/app/actions/subscriptions', () => ({ setSubscription }))

const { SubscribeButton } = await import('@/components/islands/subscribe-button')

beforeEach(() => {
  setSubscription.mockClear()
})
afterEach(cleanup)

describe('SubscribeButton', () => {
  it('joins at once and keeps it when Reddit agrees', async () => {
    render(<SubscribeButton name="typescript" kind="community" subscribed={false} />)
    const button = screen.getByRole('button', { name: 'Join r/typescript' })
    await act(async () => fireEvent.click(button))
    expect(screen.getByRole('button').textContent).toBe('Joined')
    expect(Object.fromEntries(setSubscription.mock.calls[0]![0])).toEqual({
      name: 'typescript',
      kind: 'community',
      subscribe: 'true',
    })
    await act(async () => resolve({ ok: true, data: { subscribed: true } }))
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('rolls back with the reason when Reddit refuses', async () => {
    render(<SubscribeButton name="spez" kind="user" subscribed />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Following u/spez' })))
    expect(screen.getByRole('button').textContent).toBe('Follow')
    await act(async () =>
      resolve({
        ok: false,
        error: { code: 'RATE_LIMITED', message: 'Reddit is rate-limiting us. Try again in 5s.' },
      }),
    )
    expect(screen.getByRole('button').textContent).toBe('Following')
    expect(screen.getByRole('alert').textContent).toContain('rate-limiting')
  })

  it('asks before leaving on the manage page', async () => {
    const hidePopover = vi.fn()
    render(<SubscribeButton name="pics" kind="community" subscribed confirmLeave />)
    const confirm = document.querySelector<HTMLElement>('[popover]')!
    Object.assign(confirm, { hidePopover })
    expect(screen.getByText('Leave r/pics?')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Leave' })))
    expect(hidePopover).toHaveBeenCalled()
    expect(Object.fromEntries(setSubscription.mock.calls[0]![0])).toMatchObject({
      subscribe: 'false',
    })
    // Left: the plain Join button replaces the confirm.
    expect(screen.getByRole('button', { name: 'Join r/pics' })).toBeTruthy()
  })

  it('asks before unfollowing a person', () => {
    render(<SubscribeButton name="spez" kind="user" subscribed confirmLeave />)
    expect(screen.getByText('Unfollow u/spez?')).toBeTruthy()
  })
})

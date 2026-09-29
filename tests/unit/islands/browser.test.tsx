// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nav = { pathname: '/home', pending: false }
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))
vi.mock('next/link', () => ({ useLinkStatus: () => ({ pending: nav.pending }) }))
vi.mock('@/app/actions/settings', () => ({ setTheme: vi.fn(), setBlurNsfw: vi.fn() }))

const { ThemeToggle } = await import('@/components/islands/theme-toggle')
const { PopoverDismiss } = await import('@/components/islands/popover-dismiss')
const { LinkPendingHint } = await import('@/components/islands/link-pending-hint')

let reducedMotion = false
beforeEach(() => {
  reducedMotion = false
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reducedMotion })),
  )
  document.documentElement.dataset.theme = 'system'
  document.cookie = 'rv_theme=; Max-Age=0; Path=/'
})
afterEach(cleanup)

describe('ThemeToggle', () => {
  it('starts from the server’s theme', () => {
    render(<ThemeToggle theme="dark" />)
    expect((screen.getByLabelText('Dark') as HTMLInputElement).checked).toBe(true)
  })

  it('applies the theme inside a view transition and remembers it', () => {
    const startViewTransition = vi.fn((apply: () => void) => apply())
    Object.assign(document, { startViewTransition })
    render(<ThemeToggle theme="system" />)
    fireEvent.click(screen.getByLabelText('Light'))
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect((screen.getByLabelText('Light') as HTMLInputElement).checked).toBe(true)
  })

  it('skips the crossfade under reduced motion', () => {
    reducedMotion = true
    const startViewTransition = vi.fn()
    Object.assign(document, { startViewTransition })
    render(<ThemeToggle theme="system" />)
    fireEvent.click(screen.getByLabelText('Dark'))
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('PopoverDismiss', () => {
  it('closes open popovers when the route changes', () => {
    const hidePopover = vi.fn()
    const open = document.createElement('div')
    open.setAttribute('popover', 'auto')
    Object.assign(open, { hidePopover })
    document.body.append(open)
    const query = vi
      .spyOn(document, 'querySelectorAll')
      .mockImplementation(((selector: string) =>
        selector === '[popover]:popover-open'
          ? [open]
          : []) as unknown as typeof document.querySelectorAll)

    const { rerender } = render(<PopoverDismiss />)
    hidePopover.mockClear()
    nav.pathname = '/r/pics'
    rerender(<PopoverDismiss />)
    expect(hidePopover).toHaveBeenCalledOnce()
    query.mockRestore()
    open.remove()
  })
})

describe('LinkPendingHint', () => {
  it('marks itself while its link is pending', () => {
    nav.pending = false
    const { container, rerender } = render(<LinkPendingHint />)
    expect(container.querySelector('[data-pending]')).toBeNull()
    nav.pending = true
    rerender(<LinkPendingHint />)
    expect(container.querySelector('[data-pending]')).not.toBeNull()
  })
})

describe('error fallbacks', () => {
  it('offers a retry on the route error page', async () => {
    const { default: AppError } = await import('@/app/(app)/error')
    const retry = vi.fn()
    render(<AppError error={new Error('x')} retry={retry} />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try again' })))
    expect(retry).toHaveBeenCalledOnce()
  })
})

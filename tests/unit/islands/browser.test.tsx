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
let deviceDark = false
const deviceListeners = new Set<() => void>()
beforeEach(() => {
  reducedMotion = false
  deviceDark = false
  deviceListeners.clear()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-color-scheme') ? deviceDark : reducedMotion,
      addEventListener: (_: string, listener: () => void) => deviceListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => deviceListeners.delete(listener),
    })),
  )
  document.documentElement.dataset.theme = 'system'
  document.cookie = 'rv_theme=; Max-Age=0; Path=/'
})
afterEach(cleanup)

describe('ThemeToggle', () => {
  it('mirrors the device while following it', () => {
    deviceDark = true
    render(<ThemeToggle theme="system" />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('Matches your device')).toBeTruthy()
    expect(screen.queryByText('Match my device')).toBeNull()
  })

  it('starts from a saved choice, whatever the device says', () => {
    deviceDark = true
    render(<ThemeToggle theme="light" />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('Always light')).toBeTruthy()
  })

  it('applies the choice inside a view transition and remembers it', () => {
    const startViewTransition = vi.fn((apply: () => void) => apply())
    Object.assign(document, { startViewTransition })
    render(<ThemeToggle theme="system" />)
    fireEvent.click(screen.getByRole('switch'))
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.cookie).toContain('rv_theme=dark')
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('Always dark')).toBeTruthy()
  })

  it('skips the crossfade under reduced motion, and can hand control back to the device', () => {
    reducedMotion = true
    const startViewTransition = vi.fn()
    Object.assign(document, { startViewTransition })
    render(<ThemeToggle theme="dark" />)
    fireEvent.click(screen.getByRole('switch'))
    expect(document.documentElement.dataset.theme).toBe('light')
    fireEvent.click(screen.getByText('Match my device'))
    expect(document.documentElement.dataset.theme).toBe('system')
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(screen.queryByText('Match my device')).toBeNull()
  })

  it('follows the device when it changes while set to system', () => {
    render(<ThemeToggle theme="system" />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
    act(() => {
      deviceDark = true
      for (const listener of deviceListeners) listener()
    })
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
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

  it('renders its own document and offers a retry when the root layout fails', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: GlobalError } = await import('@/app/global-error')
    const retry = vi.fn()
    const html = renderToStaticMarkup(<GlobalError error={new Error('x')} retry={retry} />)
    expect(html).toMatch(/^<html lang="en"/)
    expect(html).toContain('<title>Something went wrong · Reddit Viewer</title>')
    expect(html).toContain('role="alert"')
    // A whole document can't mount in the test DOM, so press the button's handler directly.
    const button = findByType(GlobalError({ error: new Error('x'), retry }), 'button')
    button.props.onClick()
    expect(retry).toHaveBeenCalledOnce()
  })
})

type Element = { type: unknown; props: { children?: unknown; onClick: () => void } }

function findByType(node: unknown, type: string): Element {
  const found = walk(node)
  if (!found) throw new Error(`no <${type}>`)
  return found

  function walk(value: unknown): Element | undefined {
    if (Array.isArray(value)) return value.map(walk).find(Boolean)
    if (!value || typeof value !== 'object' || !('props' in value)) return undefined
    const element = value as Element
    return element.type === type ? element : walk(element.props.children)
  }
}

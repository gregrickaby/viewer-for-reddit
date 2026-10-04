// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { ScrollToTop } = await import('@/components/islands/scroll-to-top')

const scrollTo = vi.fn()
let reduceMotion = false

/** The sentinel's observer: tests report whether the top of the page is in view. */
let report: IntersectionObserverCallback | null = null
let disconnected = false
class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    report = callback
  }
  observe() {}
  disconnect() {
    disconnected = true
  }
}

beforeEach(() => {
  report = null
  disconnected = false
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  window.matchMedia = ((query: string) => ({
    matches: reduceMotion && query.includes('reduce'),
  })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  scrollTo.mockClear()
  reduceMotion = false
  vi.unstubAllGlobals()
})

/** Scrolls so the 200px sentinel at the top of the page is in view, or not. */
function topInView(inView: boolean) {
  act(() =>
    report!([{ isIntersecting: inView } as IntersectionObserverEntry], {} as IntersectionObserver),
  )
}

describe('ScrollToTop', () => {
  it('appears once the top 200px of the page scroll away', () => {
    const { unmount } = render(<ScrollToTop />)
    const button = document.querySelector('button')!
    const sentinel = document.querySelector<HTMLElement>('span[aria-hidden]')!
    expect(sentinel.style.blockSize).toBe('200px')
    expect(button.getAttribute('data-visible')).toBe('false')
    expect(button.inert).toBe(true)
    topInView(true)
    expect(button.getAttribute('data-visible')).toBe('false')
    topInView(false)
    expect(button.getAttribute('data-visible')).toBe('true')
    expect(button.inert).toBe(false)
    topInView(true)
    expect(button.getAttribute('data-visible')).toBe('false')
    unmount()
    expect(disconnected).toBe(true)
  })

  it('scrolls to the top smoothly, or at once when motion is reduced', () => {
    render(<ScrollToTop />)
    topInView(false)
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' })
    reduceMotion = true
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
  })
})

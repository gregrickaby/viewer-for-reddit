// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { ScrollToTop } = await import('@/components/islands/scroll-to-top')

const scrollTo = vi.fn()
let reduceMotion = false

beforeEach(() => {
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  window.matchMedia = ((query: string) => ({
    matches: reduceMotion && query.includes('reduce'),
  })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  scrollTo.mockClear()
  reduceMotion = false
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})

function scrollBy(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('ScrollToTop', () => {
  it('appears only after scrolling past 200px', () => {
    render(<ScrollToTop />)
    const button = document.querySelector('button')!
    expect(button.getAttribute('data-visible')).toBe('false')
    expect(button.inert).toBe(true)
    scrollBy(200)
    expect(button.getAttribute('data-visible')).toBe('false')
    scrollBy(201)
    expect(button.getAttribute('data-visible')).toBe('true')
    expect(button.inert).toBe(false)
    scrollBy(50)
    expect(button.getAttribute('data-visible')).toBe('false')
  })

  it('scrolls to the top smoothly, or at once when motion is reduced', () => {
    render(<ScrollToTop />)
    scrollBy(900)
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' })
    reduceMotion = true
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
  })

  it('starts visible when the page loads already scrolled', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    render(<ScrollToTop />)
    expect(document.querySelector('button')!.getAttribute('data-visible')).toBe('true')
  })
})

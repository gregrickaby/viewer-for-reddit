import BackToTop from '@/components/BackToTop'
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

describe('<BackToTop />', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0
    })
  })

  it('does not show the button initially', () => {
    render(<BackToTop />)
    const button = screen.queryByRole('button', {
      name: /go back to the top/i
    })
    expect(button).not.toBeInTheDocument()
  })

  it('shows the button when scrollY > 200', async () => {
    render(<BackToTop />)

    await act(async () => {
      window.scrollY = 250
      window.dispatchEvent(new Event('scroll'))

      // Wait for debounce and DOM update
      await new Promise((r) => setTimeout(r, 250))
    })

    const button = await screen.findByRole('button', {
      name: /go back to the top/i
    })
    expect(button).toBeInTheDocument()
  })

  it('scrolls to top when clicked', async () => {
    const scrollToMock = vi.fn()
    window.scrollTo = scrollToMock

    render(<BackToTop />)

    await act(async () => {
      window.scrollY = 300
      window.dispatchEvent(new Event('scroll'))

      await new Promise((r) => setTimeout(r, 50))
    })

    const button = await screen.findByRole('button', {
      name: /go back to the top/i
    })

    await userEvent.click(button)

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    })
  })
})

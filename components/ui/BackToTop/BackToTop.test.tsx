import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import BackToTop from './BackToTop'

let mockScrollY = 0
const mockScrollTo = vi.fn()

vi.mock('@mantine/hooks', () => ({
  useWindowScroll: vi.fn(() => [{x: 0, y: mockScrollY}, mockScrollTo])
}))

describe('BackToTop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScrollY = 0
  })

  describe('visibility', () => {
    it('does not render when scroll is at top', () => {
      mockScrollY = 0
      render(<BackToTop />)

      expect(
        screen.queryByRole('button', {name: /go back to the top/i})
      ).not.toBeInTheDocument()
    })

    it('does not render when scroll is below threshold', () => {
      mockScrollY = 99 // Below 100 threshold
      render(<BackToTop />)

      expect(
        screen.queryByRole('button', {name: /go back to the top/i})
      ).not.toBeInTheDocument()
    })

    it('renders when scroll exceeds threshold', () => {
      mockScrollY = 201
      render(<BackToTop />)

      expect(
        screen.getByRole('button', {name: /go back to the top/i})
      ).toBeInTheDocument()
    })

    it('renders at exact threshold', () => {
      mockScrollY = 100 // At threshold, should not render (<=)
      render(<BackToTop />)

      expect(
        screen.queryByRole('button', {name: /go back to the top/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('scrolls to top when clicked', async () => {
      mockScrollY = 500

      render(<BackToTop />)

      const button = screen.getByRole('button', {name: /go back to the top/i})
      await user.click(button)

      expect(mockScrollTo).toHaveBeenCalledWith({y: 0})
      expect(mockScrollTo).toHaveBeenCalledTimes(1)
    })

    it('handles multiple clicks', async () => {
      mockScrollY = 500

      render(<BackToTop />)

      const button = screen.getByRole('button', {name: /go back to the top/i})
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockScrollTo).toHaveBeenCalledTimes(3)
      expect(mockScrollTo).toHaveBeenCalledWith({y: 0})
    })
  })

  describe('accessibility', () => {
    it('has correct aria-label', () => {
      mockScrollY = 500
      render(<BackToTop />)

      const button = screen.getByRole('button', {
        name: 'Go back to the top of the page'
      })
      expect(button).toBeInTheDocument()
    })

    it('has title attribute', () => {
      mockScrollY = 500
      render(<BackToTop />)

      const button = screen.getByRole('button', {name: /go back to the top/i})
      expect(button).toHaveAttribute('title', 'Go back to the top of the page')
    })

    it('icon has aria-hidden attribute', () => {
      mockScrollY = 500
      const {container} = render(<BackToTop />)

      // eslint-disable-next-line testing-library/no-container
      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('edge cases', () => {
    it('handles very large scroll values', () => {
      mockScrollY = 999999
      render(<BackToTop />)

      expect(
        screen.getByRole('button', {name: /go back to the top/i})
      ).toBeInTheDocument()
    })

    it('handles negative scroll values', () => {
      mockScrollY = -100
      render(<BackToTop />)

      expect(
        screen.queryByRole('button', {name: /go back to the top/i})
      ).not.toBeInTheDocument()
    })

    it('handles fractional scroll values below threshold', () => {
      mockScrollY = 99.5 // Below 100 threshold
      render(<BackToTop />)

      expect(
        screen.queryByRole('button', {name: /go back to the top/i})
      ).not.toBeInTheDocument()
    })

    it('handles fractional scroll values above threshold', () => {
      mockScrollY = 200.1
      render(<BackToTop />)

      expect(
        screen.getByRole('button', {name: /go back to the top/i})
      ).toBeInTheDocument()
    })
  })
})

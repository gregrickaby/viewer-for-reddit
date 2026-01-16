import {useBossButton} from '@/lib/hooks/useBossButton'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import BossButton from './BossButton'

vi.mock('@/lib/hooks/useBossButton')

const mockUseBossButton = vi.mocked(useBossButton)

describe('BossButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('does not render when shouldShow is false', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: false,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('renders when shouldShow is true', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      expect(screen.getByRole('link', {name: 'Quick Exit'})).toBeInTheDocument()
    })
  })

  describe('rendering', () => {
    it('renders as anchor link with correct href', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit'})
      expect(link).toHaveAttribute('href', 'https://duckduckgo.com/')
    })

    it('renders with custom redirect URL', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://google.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit'})
      expect(link).toHaveAttribute('href', 'https://google.com/')
    })

    it('passes default redirect URL to hook', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      expect(mockUseBossButton).toHaveBeenCalledWith('https://duckduckgo.com/')
    })

    it('renders tooltip with button text', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit - Press Escape'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit - Press Escape'})
      expect(link).toBeInTheDocument()
    })
  })

  describe('analytics tracking', () => {
    it('has umami event attribute', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit'})
      expect(link).toHaveAttribute('data-umami-event', 'boss-button')
    })
  })

  describe('accessibility', () => {
    it('has correct aria-label', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit'})
      expect(link).toHaveAttribute('aria-label', 'Quick Exit')
    })

    it('icon has aria-hidden attribute', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: 'Quick Exit'
      })

      const {container} = render(<BossButton />)

      // eslint-disable-next-line testing-library/no-container
      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('edge cases', () => {
    it('handles empty redirectUrl', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: false, // Hook returns false when URL is invalid
        redirectUrl: '',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      // Component should not render with invalid URL
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('handles empty buttonText', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: ''
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: ''})
      expect(link).toBeInTheDocument()
    })

    it('handles special characters in URL', () => {
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://example.com/page?param=value&other=test',
        buttonText: 'Quick Exit'
      })

      render(<BossButton />)

      const link = screen.getByRole('link', {name: 'Quick Exit'})
      expect(link).toHaveAttribute(
        'href',
        'https://example.com/page?param=value&other=test'
      )
    })

    it('handles very long buttonText', () => {
      const longText = 'Very Long Button Text '.repeat(10)
      mockUseBossButton.mockReturnValue({
        shouldShow: true,
        redirectUrl: 'https://duckduckgo.com/',
        buttonText: longText
      })

      render(<BossButton />)

      const link = screen.getAllByRole('link')[0]
      expect(link).toBeInTheDocument()
    })
  })
})

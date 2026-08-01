import {render, screen} from '@/test-utils'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import SwipeNavigation from './SwipeNavigation'

// Mock next/navigation
const mockBack = vi.fn()
const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    back: mockBack,
    push: vi.fn(),
    refresh: vi.fn()
  })),
  usePathname: () => mockUsePathname()
}))

// Mock useSwipeNavigation hook
const mockUseSwipeNavigation = vi.fn()
vi.mock('@/lib/hooks/useSwipeNavigation', () => ({
  useSwipeNavigation: (options?: {enabled?: boolean}) =>
    mockUseSwipeNavigation(options)
}))

describe('SwipeNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    mockUsePathname.mockReturnValue('/r/programming')
    expect(() => render(<SwipeNavigation />)).not.toThrow()
  })

  it('returns null (no visual UI)', () => {
    mockUsePathname.mockReturnValue('/r/programming')
    render(<SwipeNavigation />)

    // Component returns null - no UI elements
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText(/swipe/i)).not.toBeInTheDocument()
  })

  describe('homepage behavior', () => {
    it('disables swipe navigation on homepage', () => {
      mockUsePathname.mockReturnValue('/')
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: false})
    })

    it('enables swipe navigation on homepage with trailing slash', () => {
      mockUsePathname.mockReturnValue('/')
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: false})
    })
  })

  describe('non-homepage behavior', () => {
    it.each([
      {description: 'subreddit pages', path: '/r/programming'},
      {
        description: 'post pages',
        path: '/r/programming/comments/abc123/title'
      },
      {description: 'user profile pages', path: '/u/spez'},
      {description: 'search pages', path: '/search/test'},
      {description: 'about page', path: '/about'},
      {description: 'donate page', path: '/donate'},
      {description: 'saved items page', path: '/user/testuser/saved'},
      {description: 'multireddit pages', path: '/user/testuser/m/tech'}
    ])('enables swipe navigation on $description', ({path}) => {
      mockUsePathname.mockReturnValue(path)
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})
    })
  })

  describe('pathname changes', () => {
    it('updates enabled state when navigating from homepage to other page', () => {
      mockUsePathname.mockReturnValue('/')
      const {rerender} = render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: false})

      // Navigate to subreddit
      mockUsePathname.mockReturnValue('/r/programming')
      rerender(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})
    })

    it('updates enabled state when navigating from other page to homepage', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      const {rerender} = render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})

      // Navigate to homepage
      mockUsePathname.mockReturnValue('/')
      rerender(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: false})
    })

    it('maintains enabled state when navigating between non-homepage pages', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      const {rerender} = render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})

      // Navigate to another subreddit
      mockUsePathname.mockReturnValue('/r/javascript')
      rerender(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})
    })
  })

  describe('edge cases', () => {
    it.each([
      {description: 'handles empty pathname', path: ''},
      {
        description: 'handles pathname with query parameters',
        path: '/r/programming?sort=top'
      },
      {description: 'handles pathname with hash', path: '/r/programming#top'},
      {
        description: 'handles deeply nested paths',
        path: '/r/programming/comments/abc/title/def?sort=top#comment-123'
      },
      {
        // Only exactly '/' should be detected as homepage
        description: 'is case-sensitive for homepage detection',
        path: '/Home'
      }
    ])('$description', ({path}) => {
      mockUsePathname.mockReturnValue(path)
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith({enabled: true})
    })
  })

  describe('hook integration', () => {
    it('calls useSwipeNavigation hook on mount', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledTimes(1)
    })

    it('calls useSwipeNavigation hook with correct enabled value', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true
        })
      )
    })

    it('passes only enabled option to hook', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      const callArgs = mockUseSwipeNavigation.mock.calls[0][0]
      expect(Object.keys(callArgs || {})).toEqual(['enabled'])
    })
  })

  describe('accessibility', () => {
    it('does not interfere with screen readers', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      // Should have no accessible elements
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByRole('region')).not.toBeInTheDocument()
    })

    it('does not add any visible UI elements', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      // Verify no visible UI
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByText(/.+/)).not.toBeInTheDocument()
    })

    it('does not affect tab navigation', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      render(<SwipeNavigation />)

      // Should have no focusable or interactive elements
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('component lifecycle', () => {
    it('unmounts cleanly', () => {
      mockUsePathname.mockReturnValue('/r/programming')
      const {unmount} = render(<SwipeNavigation />)

      expect(() => unmount()).not.toThrow()
    })

    it('can be remounted multiple times', () => {
      mockUsePathname.mockReturnValue('/r/programming')

      const {unmount: unmount1} = render(<SwipeNavigation />)
      unmount1()

      const {unmount: unmount2} = render(<SwipeNavigation />)
      expect(mockUseSwipeNavigation).toHaveBeenCalledTimes(2)
      unmount2()
    })

    it('updates when pathname changes', () => {
      mockUsePathname.mockReturnValue('/')
      const {rerender} = render(<SwipeNavigation />)

      // Change pathname
      mockUsePathname.mockReturnValue('/r/programming')
      rerender(<SwipeNavigation />)

      // Should have been called twice (initial + rerender)
      expect(mockUseSwipeNavigation).toHaveBeenCalledTimes(2)
    })
  })

  describe('multiple instances', () => {
    it('handles multiple SwipeNavigation instances', () => {
      mockUsePathname.mockReturnValue('/r/programming')

      render(<SwipeNavigation />)
      render(<SwipeNavigation />)

      expect(mockUseSwipeNavigation).toHaveBeenCalledTimes(2)
    })

    it('each instance respects its own pathname', () => {
      // This shouldn't happen in practice, but testing edge case
      mockUsePathname.mockReturnValueOnce('/')
      render(<SwipeNavigation />)
      expect(mockUseSwipeNavigation).toHaveBeenLastCalledWith({enabled: false})

      mockUsePathname.mockReturnValueOnce('/r/programming')
      render(<SwipeNavigation />)
      expect(mockUseSwipeNavigation).toHaveBeenLastCalledWith({enabled: true})
    })
  })
})

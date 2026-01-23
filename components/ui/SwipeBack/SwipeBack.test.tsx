import {render} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import SwipeBack from './SwipeBack'

// Mock useSwipeBack hook
const mockUseSwipeBack = vi.fn()
vi.mock('@/lib/hooks', () => ({
  useSwipeBack: (options?: {enabled?: boolean}) => mockUseSwipeBack(options)
}))

// Mock next/navigation
let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

describe('SwipeBack', () => {
  it('renders without visual content', () => {
    render(<SwipeBack />)
    // Component returns null, so no visible elements should be rendered
    // We just verify the hook is called with the correct options
    expect(mockUseSwipeBack).toHaveBeenCalled()
  })

  it('enables swipe back on non-homepage routes', () => {
    mockPathname = '/r/popular'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })

  it('disables swipe back on homepage', () => {
    mockPathname = '/'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: false
    })
  })

  it('enables swipe back on post pages', () => {
    mockPathname = '/r/AskReddit/comments/abc123/test-post'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })

  it('enables swipe back on user profile pages', () => {
    mockPathname = '/u/testuser'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })

  it('enables swipe back on search pages', () => {
    mockPathname = '/search/test%20query'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })

  it('enables swipe back on subreddit pages', () => {
    mockPathname = '/r/programming'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })

  it('enables swipe back on about page', () => {
    mockPathname = '/about'
    render(<SwipeBack />)

    expect(mockUseSwipeBack).toHaveBeenCalledWith({
      enabled: true
    })
  })
})

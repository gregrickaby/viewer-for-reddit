import {render} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import SwipeNavigation from './SwipeNavigation'

const mockUseSwipeNavigation = vi.fn()
vi.mock('@/lib/hooks', () => ({
  useSwipeNavigation: (options?: any) => mockUseSwipeNavigation(options)
}))

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

describe('SwipeNavigation', () => {
  it('renders without visual content', () => {
    render(<SwipeNavigation />)
    expect(mockUseSwipeNavigation).toHaveBeenCalled()
  })

  it('disables swipe navigation on homepage', () => {
    mockPathname = '/'
    render(<SwipeNavigation />)

    expect(mockUseSwipeNavigation).toHaveBeenCalledWith({
      enabled: false,
      enableNextPost: false
    })
  })

  it('enables swipe navigation on subreddit pages', () => {
    mockPathname = '/r/programming'
    render(<SwipeNavigation />)

    expect(mockUseSwipeNavigation).toHaveBeenCalledWith({
      enabled: true,
      enableNextPost: false
    })
  })

  it('enables next-post navigation on post pages', () => {
    mockPathname = '/r/AskReddit/comments/abc123/test-post'
    render(<SwipeNavigation />)

    expect(mockUseSwipeNavigation).toHaveBeenCalledWith({
      enabled: true,
      enableNextPost: true
    })
  })

  it('enables swipe navigation on user profile pages', () => {
    mockPathname = '/u/testuser'
    render(<SwipeNavigation />)

    expect(mockUseSwipeNavigation).toHaveBeenCalledWith({
      enabled: true,
      enableNextPost: false
    })
  })

  it('enables swipe navigation on search pages', () => {
    mockPathname = '/search/test%20query'
    render(<SwipeNavigation />)

    expect(mockUseSwipeNavigation).toHaveBeenCalledWith({
      enabled: true,
      enableNextPost: false
    })
  })

  it('enables next-post navigation only when on post page', () => {
    // Regular subreddit page
    mockPathname = '/r/programming'
    const {rerender} = render(<SwipeNavigation />)
    expect(mockUseSwipeNavigation).toHaveBeenLastCalledWith({
      enabled: true,
      enableNextPost: false
    })

    // Post page
    mockPathname = '/r/programming/comments/xyz/cool-post'
    rerender(<SwipeNavigation />)
    expect(mockUseSwipeNavigation).toHaveBeenLastCalledWith({
      enabled: true,
      enableNextPost: true
    })
  })
})

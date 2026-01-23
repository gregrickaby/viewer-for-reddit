import {PostNavigationProvider} from '@/lib/contexts/PostNavigationContext'
import {render} from '@/test-utils'
import {fireEvent, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {PostNavigationTracker} from '../PostNavigationTracker/PostNavigationTracker'
import SwipeNavigation from '../SwipeNavigation/SwipeNavigation'

// Mock reddit actions to prevent env var loading
vi.mock('@/lib/actions/reddit', () => ({
  fetchPosts: vi.fn(),
  fetchPost: vi.fn(),
  fetchUserSubscriptions: vi.fn(),
  getCurrentUserAvatar: vi.fn()
}))

// Mock next/navigation
const mockBack = vi.fn()
const mockPush = vi.fn()
const mockPrefetch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    prefetch: mockPrefetch,
    refresh: vi.fn()
  }),
  usePathname: () => '/r/programming/comments/abc123/test-post'
}))

vi.mock('@/lib/utils/reddit-helpers', () => ({
  extractSlug: (permalink: string, postId: string) => {
    const parts = permalink.split('/')
    const idIndex = parts.indexOf(postId)
    if (idIndex !== -1 && parts[idIndex + 1]) {
      return parts[idIndex + 1]
    }
    return 'post'
  }
}))

describe('SwipeNavigation Integration', () => {
  const mockPosts = [
    {
      name: 't3_post1',
      id: 'post1',
      title: 'First Post',
      subreddit: 'programming',
      subreddit_name_prefixed: 'r/programming',
      author: 'user1',
      score: 100,
      num_comments: 10,
      created_utc: 1234567890,
      permalink: '/r/programming/comments/post1/first_post',
      url: 'https://reddit.com/r/programming/comments/post1',
      selftext: '',
      thumbnail: '',
      is_video: false,
      over_18: false,
      stickied: false,
      likes: null,
      ups: 100,
      downs: 0
    },
    {
      name: 't3_post2',
      id: 'post2',
      title: 'Second Post',
      subreddit: 'programming',
      subreddit_name_prefixed: 'r/programming',
      author: 'user2',
      score: 200,
      num_comments: 20,
      created_utc: 1234567891,
      permalink: '/r/programming/comments/post2/second_post',
      url: 'https://reddit.com/r/programming/comments/post2',
      selftext: '',
      thumbnail: '',
      is_video: false,
      over_18: false,
      stickied: false,
      likes: null,
      ups: 200,
      downs: 0
    },
    {
      name: 't3_post3',
      id: 'post3',
      title: 'Third Post',
      subreddit: 'programming',
      subreddit_name_prefixed: 'r/programming',
      author: 'user3',
      score: 300,
      num_comments: 30,
      created_utc: 1234567892,
      permalink: '/r/programming/comments/post3/third_post',
      url: 'https://reddit.com/r/programming/comments/post3',
      selftext: '',
      thumbnail: '',
      is_video: false,
      over_18: false,
      stickied: false,
      likes: null,
      ups: 300,
      downs: 0
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const simulateSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{clientX: startX, clientY: startY} as Touch]
    })
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{clientX: endX, clientY: endY} as Touch]
    })
    const touchEndEvent = new TouchEvent('touchend')

    fireEvent(document, touchStartEvent)
    fireEvent(document, touchMoveEvent)
    fireEvent(document, touchEndEvent)
  }

  it('navigates from post list to post to next post via swipe', async () => {
    // Step 1: Render list page with posts
    const {rerender} = render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Step 2: Simulate viewing first post
    rerender(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Wait for prefetch to be called
    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })

    // Step 3: Swipe left to go to next post
    simulateSwipe(200, 100, 50, 100)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })
  })

  it('navigates back from post via right swipe', async () => {
    render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post2" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Swipe right to go back
    simulateSwipe(50, 100, 200, 100)

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  it('does not navigate to next post when at end of list', async () => {
    render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post3" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Try to swipe left at last post
    simulateSwipe(200, 100, 50, 100)

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('handles post list updates during navigation', async () => {
    const {rerender} = render(
      <PostNavigationProvider>
        <PostNavigationTracker
          posts={[mockPosts[0]]}
          currentPostId="t3_post1"
        />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Initially at first post, no next post available
    simulateSwipe(200, 100, 50, 100)
    expect(mockPush).not.toHaveBeenCalled()

    // Update list to include more posts
    rerender(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Wait for prefetch
    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })

    // Now next post should be available
    simulateSwipe(200, 100, 50, 100)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })
  })

  it('prefetches next post when viewing current post', async () => {
    render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Should prefetch next post
    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })
  })

  it('does not prefetch when no next post available', async () => {
    render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post3" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Should not prefetch (at end of list)
    await waitFor(
      () => {
        expect(mockPrefetch).not.toHaveBeenCalled()
      },
      {timeout: 100}
    )
  })

  it('handles sequential navigation through multiple posts', async () => {
    const {rerender} = render(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Navigate to post 2
    simulateSwipe(200, 100, 50, 100)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/r/programming/comments/post2/second_post'
      )
    })

    // Update to post 2
    rerender(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post2" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Navigate to post 3
    simulateSwipe(200, 100, 50, 100)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/r/programming/comments/post3/third_post'
      )
    })

    // Update to post 3
    rerender(
      <PostNavigationProvider>
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post3" />
        <SwipeNavigation />
      </PostNavigationProvider>
    )

    // Try to navigate past end
    simulateSwipe(200, 100, 50, 100)

    // Should not navigate (already at end)
    expect(mockPush).toHaveBeenCalledTimes(2) // Still only 2 calls from before
  })
})

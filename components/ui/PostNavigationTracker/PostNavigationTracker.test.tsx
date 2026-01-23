import type {RedditPost} from '@/lib/types/reddit'
import {render} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {PostNavigationTracker} from './PostNavigationTracker'

const mockSetPosts = vi.fn()
const mockSetCurrentPostId = vi.fn()

vi.mock('@/lib/contexts/PostNavigationContext', () => ({
  usePostNavigation: () => ({
    setPosts: mockSetPosts,
    setCurrentPostId: mockSetCurrentPostId,
    getNextPost: vi.fn(),
    getPreviousPost: vi.fn(),
    posts: [],
    currentPostId: null
  })
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

describe('PostNavigationTracker', () => {
  const mockPosts: RedditPost[] = [
    {
      name: 't3_post1',
      id: 'post1',
      title: 'Test Post 1',
      subreddit: 'test',
      subreddit_name_prefixed: 'r/test',
      author: 'user1',
      score: 100,
      num_comments: 10,
      created_utc: 1234567890,
      permalink: '/r/test/comments/post1/test_post_1',
      url: 'https://reddit.com/r/test/comments/post1',
      selftext: 'Test content',
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
      title: 'Test Post 2',
      subreddit: 'test',
      subreddit_name_prefixed: 'r/test',
      author: 'user2',
      score: 200,
      num_comments: 20,
      created_utc: 1234567891,
      permalink: '/r/test/comments/post2/test_post_2',
      url: 'https://reddit.com/r/test/comments/post2',
      selftext: '',
      thumbnail: 'https://example.com/thumb.jpg',
      is_video: false,
      over_18: false,
      stickied: false,
      likes: null,
      ups: 200,
      downs: 0
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list page mode', () => {
    it('renders without visual output', () => {
      render(<PostNavigationTracker posts={mockPosts} />)
      expect(mockSetPosts).toHaveBeenCalled()
    })

    it('registers posts on mount', () => {
      render(<PostNavigationTracker posts={mockPosts} />)

      expect(mockSetPosts).toHaveBeenCalledWith([
        {
          id: 't3_post1',
          url: '/r/test/comments/post1/test_post_1',
          title: 'Test Post 1'
        },
        {
          id: 't3_post2',
          url: '/r/test/comments/post2/test_post_2',
          title: 'Test Post 2'
        }
      ])
    })

    it('clears posts on unmount', () => {
      const {unmount} = render(<PostNavigationTracker posts={mockPosts} />)

      unmount()

      expect(mockSetPosts).toHaveBeenCalledWith([])
    })

    it('updates posts when prop changes', () => {
      const {rerender} = render(
        <PostNavigationTracker posts={[mockPosts[0]]} />
      )

      expect(mockSetPosts).toHaveBeenCalledWith([
        {
          id: 't3_post1',
          url: '/r/test/comments/post1/test_post_1',
          title: 'Test Post 1'
        }
      ])

      rerender(<PostNavigationTracker posts={mockPosts} />)

      expect(mockSetPosts).toHaveBeenCalledWith([
        {
          id: 't3_post1',
          url: '/r/test/comments/post1/test_post_1',
          title: 'Test Post 1'
        },
        {
          id: 't3_post2',
          url: '/r/test/comments/post2/test_post_2',
          title: 'Test Post 2'
        }
      ])
    })

    it('handles empty post array', () => {
      render(<PostNavigationTracker posts={[]} />)

      expect(mockSetPosts).toHaveBeenCalledWith([])
    })
  })

  describe('post page mode', () => {
    it('sets current post ID on mount', () => {
      render(<PostNavigationTracker currentPostId="t3_test123" />)

      expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_test123')
    })

    it('clears current post ID on unmount', () => {
      const {unmount} = render(
        <PostNavigationTracker currentPostId="t3_test123" />
      )

      unmount()

      expect(mockSetCurrentPostId).toHaveBeenCalledWith(null)
    })

    it('updates post ID when prop changes', () => {
      const {rerender} = render(
        <PostNavigationTracker currentPostId="t3_first" />
      )

      expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_first')

      rerender(<PostNavigationTracker currentPostId="t3_second" />)

      expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_second')
    })
  })

  describe('combined mode', () => {
    it('handles both posts and currentPostId', () => {
      render(
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
      )

      expect(mockSetPosts).toHaveBeenCalledWith([
        {
          id: 't3_post1',
          url: '/r/test/comments/post1/test_post_1',
          title: 'Test Post 1'
        },
        {
          id: 't3_post2',
          url: '/r/test/comments/post2/test_post_2',
          title: 'Test Post 2'
        }
      ])
      expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_post1')
    })

    it('clears both on unmount', () => {
      const {unmount} = render(
        <PostNavigationTracker posts={mockPosts} currentPostId="t3_post1" />
      )

      unmount()

      expect(mockSetPosts).toHaveBeenCalledWith([])
      expect(mockSetCurrentPostId).toHaveBeenCalledWith(null)
    })
  })

  describe('no props mode', () => {
    it('renders without errors when no props provided', () => {
      render(<PostNavigationTracker />)

      expect(mockSetPosts).not.toHaveBeenCalled()
      expect(mockSetCurrentPostId).not.toHaveBeenCalled()
    })
  })
})

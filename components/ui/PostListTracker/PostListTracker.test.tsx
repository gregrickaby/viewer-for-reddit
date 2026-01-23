import type {RedditPost} from '@/lib/types/reddit'
import {render} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {PostListTracker} from './PostListTracker'

const mockSetPosts = vi.fn()

vi.mock('@/lib/contexts/PostNavigationContext', () => ({
  usePostNavigation: () => ({
    setPosts: mockSetPosts,
    setCurrentPostId: vi.fn(),
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

describe('PostListTracker', () => {
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

  it('renders without visual output', () => {
    render(<PostListTracker posts={mockPosts} />)
    // Component returns null, no visible elements rendered
    expect(mockSetPosts).toHaveBeenCalled()
  })

  it('registers posts on mount', () => {
    render(<PostListTracker posts={mockPosts} />)

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
    const {unmount} = render(<PostListTracker posts={mockPosts} />)

    unmount()

    expect(mockSetPosts).toHaveBeenCalledWith([])
  })

  it('updates posts when prop changes', () => {
    const {rerender} = render(<PostListTracker posts={[mockPosts[0]]} />)

    expect(mockSetPosts).toHaveBeenCalledWith([
      {
        id: 't3_post1',
        url: '/r/test/comments/post1/test_post_1',
        title: 'Test Post 1'
      }
    ])

    rerender(<PostListTracker posts={mockPosts} />)

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
    render(<PostListTracker posts={[]} />)

    expect(mockSetPosts).toHaveBeenCalledWith([])
  })

  it('converts RedditPost to NavigablePost format', () => {
    const singlePost = [mockPosts[0]]
    render(<PostListTracker posts={singlePost} />)

    const convertedPost = mockSetPosts.mock.calls[0][0][0]
    expect(convertedPost).toHaveProperty('id')
    expect(convertedPost).toHaveProperty('url')
    expect(convertedPost).toHaveProperty('title')
    expect(convertedPost.id).toBe('t3_post1')
    expect(convertedPost.title).toBe('Test Post 1')
  })
})

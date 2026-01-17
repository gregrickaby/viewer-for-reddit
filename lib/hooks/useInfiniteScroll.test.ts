import {fetchPosts} from '@/lib/actions/reddit'
import type {RedditPost} from '@/lib/types/reddit'
import {act, renderHook} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useInfiniteScroll} from './useInfiniteScroll'

// Mock the fetchPosts Server Action
vi.mock('@/lib/actions/reddit', () => ({
  fetchPosts: vi.fn(async () => ({posts: [], after: null}))
}))

const mockFetchPosts = vi.mocked(fetchPosts)

type UseInfiniteScrollReturn = ReturnType<typeof useInfiniteScroll>

const mockPosts: RedditPost[] = [
  {
    id: 'post1',
    name: 't3_post1',
    title: 'Test Post 1',
    author: 'testuser',
    subreddit: 'test',
    score: 100,
    num_comments: 10,
    created_utc: 1234567890,
    permalink: '/r/test/comments/post1/test_post_1/',
    url: 'https://reddit.com/r/test/comments/post1'
  } as RedditPost
]

describe('useInfiniteScroll', () => {
  let mockObserver: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchPosts.mockResolvedValue({posts: [], after: null})

    // Mock IntersectionObserver
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    }

    global.IntersectionObserver = class {
      constructor(callback: any) {
        mockObserver.callback = callback
      }

      observe = mockObserver.observe
      disconnect = mockObserver.disconnect
      unobserve = mockObserver.unobserve
    } as any
  })

  it('initializes with initial posts', () => {
    const {result} = renderHook(() =>
      useInfiniteScroll({
        initialPosts: mockPosts,
        initialAfter: 't3_after1',
        subreddit: 'test'
      })
    )

    expect(result.current.posts).toEqual(mockPosts)
    expect(result.current.loading).toBe(false)
    expect(result.current.hasMore).toBe(true)
  })

  it('sets hasMore to false when no initialAfter', () => {
    const {result} = renderHook(() =>
      useInfiniteScroll({
        initialPosts: mockPosts,
        subreddit: 'test'
      })
    )

    expect(result.current.hasMore).toBe(false)
  })

  it('observes sentinel element when ref is set', () => {
    const {result} = renderHook(() =>
      useInfiniteScroll({
        initialPosts: mockPosts,
        initialAfter: 't3_after1',
        subreddit: 'test'
      })
    )

    const mockElement = document.createElement('div')

    act(() => {
      result.current.sentinelRef(mockElement)
    })

    expect(mockObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it('resets posts when initialPosts change', () => {
    interface Props {
      posts: RedditPost[]
      after: string
    }

    const {result, rerender} = renderHook<UseInfiniteScrollReturn, Props>(
      ({posts, after}) =>
        useInfiniteScroll({
          initialPosts: posts,
          initialAfter: after,
          subreddit: 'test'
        }),
      {
        initialProps: {
          posts: mockPosts,
          after: 't3_after1'
        }
      }
    )

    expect(result.current.posts).toEqual(mockPosts)

    const newPosts = [{...mockPosts[0], id: 'newpost'}] as RedditPost[]

    rerender({
      posts: newPosts,
      after: 't3_newafter'
    })

    expect(result.current.posts).toEqual(newPosts)
  })

  it('passes timeFilter to fetchPosts when loading more', async () => {
    mockFetchPosts.mockResolvedValue({
      posts: [{...mockPosts[0], id: 'post2'} as RedditPost],
      after: 't3_after2'
    })

    const {result} = renderHook(() =>
      useInfiniteScroll({
        initialPosts: mockPosts,
        initialAfter: 't3_after1',
        subreddit: 'test',
        sort: 'top',
        timeFilter: 'week'
      })
    )

    const mockElement = document.createElement('div')

    act(() => {
      result.current.sentinelRef(mockElement)
    })

    // Simulate intersection
    await act(async () => {
      mockObserver.callback([{isIntersecting: true}])
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockFetchPosts).toHaveBeenCalledWith(
      'test',
      'top',
      't3_after1',
      'week'
    )
  })

  it('passes undefined timeFilter when not provided', async () => {
    mockFetchPosts.mockResolvedValue({
      posts: [{...mockPosts[0], id: 'post2'} as RedditPost],
      after: 't3_after2'
    })

    const {result} = renderHook(() =>
      useInfiniteScroll({
        initialPosts: mockPosts,
        initialAfter: 't3_after1',
        subreddit: 'test',
        sort: 'hot'
      })
    )

    const mockElement = document.createElement('div')

    act(() => {
      result.current.sentinelRef(mockElement)
    })

    // Simulate intersection
    await act(async () => {
      mockObserver.callback([{isIntersecting: true}])
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockFetchPosts).toHaveBeenCalledWith(
      'test',
      'hot',
      't3_after1',
      undefined
    )
  })
})

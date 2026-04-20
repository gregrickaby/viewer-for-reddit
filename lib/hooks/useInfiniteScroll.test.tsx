import {fetchPosts, fetchUserPosts} from '@/lib/actions/reddit/posts'
import type {RedditPost, SortOption, TimeFilter} from '@/lib/types/reddit'
import {mockObserver} from '@/test-utils/intersectionObserverMock'
import {act, render, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useInfiniteScroll} from './useInfiniteScroll'

// Mock the fetchPosts Server Action
vi.mock('@/lib/actions/reddit/posts', () => ({
  fetchPosts: vi.fn(async () => ({posts: [], after: null})),
  fetchUserPosts: vi.fn(async () => ({posts: [], after: null}))
}))

const mockFetchPosts = vi.mocked(fetchPosts)
const mockFetchUserPosts = vi.mocked(fetchUserPosts)

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

// ---------------------------------------------------------------------------
// Test harness — renders the hook with an attached sentinel so the
// IntersectionObserver is created and mockObserver._trigger works.
// ---------------------------------------------------------------------------

interface HarnessProps {
  initialPosts: RedditPost[]
  initialAfter?: string | null
  subreddit?: string
  username?: string
  sort?: SortOption
  timeFilter?: TimeFilter
}

function renderWithSentinel(props: HarnessProps) {
  let hookResult: UseInfiniteScrollReturn

  function TestHook() {
    hookResult = useInfiniteScroll(props)
    return hookResult.hasMore ? (
      <div ref={hookResult.sentinelRef} data-testid="sentinel" />
    ) : null
  }

  const utils = render(<TestHook />)
  return {getResult: () => hookResult, utils}
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchPosts.mockResolvedValue({posts: [], after: null})
    mockFetchUserPosts.mockResolvedValue({posts: [], after: null})
  })

  // -------------------------------------------------------------------------
  // Initialisation — no intersection needed, use renderHook.
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Loading behaviour — needs the sentinel + intersection trigger.
  // -------------------------------------------------------------------------

  it('passes timeFilter to fetchPosts when loading more', async () => {
    mockFetchPosts.mockResolvedValue({
      posts: [{...mockPosts[0], id: 'post2'} as RedditPost],
      after: 't3_after2'
    })

    renderWithSentinel({
      initialPosts: mockPosts,
      initialAfter: 't3_after1',
      subreddit: 'test',
      sort: 'top',
      timeFilter: 'week'
    })

    await act(async () => {
      mockObserver._trigger(true)
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

    renderWithSentinel({
      initialPosts: mockPosts,
      initialAfter: 't3_after1',
      subreddit: 'test',
      sort: 'hot'
    })

    await act(async () => {
      mockObserver._trigger(true)
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockFetchPosts).toHaveBeenCalledWith(
      'test',
      'hot',
      't3_after1',
      undefined
    )
  })

  it('uses fetchUserPosts when username is provided', async () => {
    mockFetchUserPosts.mockResolvedValue({
      posts: [{...mockPosts[0], id: 'post2'}] as RedditPost[],
      after: 't3_after2'
    })

    renderWithSentinel({
      initialPosts: mockPosts,
      initialAfter: 't3_after1',
      username: 'testuser',
      sort: 'new'
    })

    await act(async () => {
      mockObserver._trigger(true)
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockFetchUserPosts).toHaveBeenCalledWith(
      'testuser',
      'new',
      't3_after1',
      undefined
    )
  })

  it('sets hasMore to false when fetch throws', async () => {
    mockFetchPosts.mockRejectedValueOnce(new Error('Network error'))

    const {getResult} = renderWithSentinel({
      initialPosts: mockPosts,
      initialAfter: 't3_after1',
      subreddit: 'test'
    })

    await act(async () => {
      mockObserver._trigger(true)
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    await waitFor(() => {
      expect(getResult().hasMore).toBe(false)
      expect(getResult().loading).toBe(false)
    })
  })

  it('sets hasMore to false when API returns no posts', async () => {
    mockFetchPosts.mockResolvedValueOnce({posts: [], after: null})

    const {getResult} = renderWithSentinel({
      initialPosts: mockPosts,
      initialAfter: 't3_after1',
      subreddit: 'test'
    })

    await act(async () => {
      mockObserver._trigger(true)
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    await waitFor(() => {
      expect(getResult().hasMore).toBe(false)
    })
  })
})

import {fetchSavedItems} from '@/lib/actions/reddit/users'
import type {RedditComment, RedditPost, SavedItem} from '@/lib/types/reddit'
import {mockObserver} from '@/test-utils/intersectionObserverMock'
import {act, render, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useInfiniteSavedItems} from './useInfiniteSavedItems'

vi.mock('@/lib/actions/reddit/users', () => ({
  fetchSavedItems: vi.fn(async () => ({
    items: [],
    after: null
  }))
}))

const mockFetchSavedItems = vi.mocked(fetchSavedItems)

const mockPost: RedditPost = {
  id: 'saved1',
  name: 't3_saved1',
  title: 'First saved post',
  author: 'testauthor',
  subreddit: 'testsubreddit',
  subreddit_name_prefixed: 'r/testsubreddit',
  created_utc: 1234567890,
  score: 100,
  ups: 120,
  downs: 20,
  num_comments: 50,
  permalink: '/r/testsubreddit/comments/saved1/first_saved_post/',
  url: 'https://www.reddit.com/r/testsubreddit/comments/saved1/first_saved_post/',
  selftext: 'This is a saved post content',
  selftext_html:
    '&lt;div class="md"&gt;&lt;p&gt;This is a saved post content&lt;/p&gt;&lt;/div&gt;',
  stickied: false,
  over_18: false,
  saved: true,
  thumbnail: '',
  is_video: false
}

const mockComment: RedditComment = {
  id: 'comment1',
  name: 't1_comment1',
  author: 'commentauthor',
  body: 'This is a saved comment',
  body_html:
    '&lt;div class="md"&gt;&lt;p&gt;This is a saved comment&lt;/p&gt;&lt;/div&gt;',
  created_utc: 1234567800,
  score: 50,
  depth: 0,
  parent_id: 't3_saved1',
  permalink: '/r/testsubreddit/comments/saved1/first_saved_post/comment1/',
  stickied: false,
  saved: true,
  score_hidden: false
}

const mockItems: SavedItem[] = [
  {type: 'post', data: mockPost},
  {type: 'comment', data: mockComment}
]

// ---------------------------------------------------------------------------
// Test harness — renders the hook with an attached sentinel so the
// IntersectionObserver is created and mockObserver._trigger works.
// ---------------------------------------------------------------------------

type UseInfiniteSavedItemsReturn = ReturnType<typeof useInfiniteSavedItems>

interface HarnessProps {
  initialItems: SavedItem[]
  initialAfter: string | null
  username: string
}

function renderWithSentinel(props: HarnessProps) {
  let hookResult: UseInfiniteSavedItemsReturn

  function TestHook() {
    hookResult = useInfiniteSavedItems(props)
    return hookResult.hasMore ? (
      <div ref={hookResult.sentinelRef} data-testid="sentinel" />
    ) : null
  }

  const utils = render(<TestHook />)
  return {getResult: () => hookResult, utils}
}

describe('useInfiniteSavedItems', () => {
  beforeEach(() => {
    mockFetchSavedItems.mockClear()
    mockFetchSavedItems.mockResolvedValue({items: [], after: null})
  })

  // -------------------------------------------------------------------------
  // Initialisation — no intersection needed, use renderHook.
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    it('initializes with provided items', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null,
          username: 'testuser'
        })
      )

      expect(result.current.items).toEqual(mockItems)
      expect(result.current.loading).toBe(false)
      expect(result.current.hasMore).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('sets hasMore to true when initialAfter is provided', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      expect(result.current.hasMore).toBe(true)
    })

    it('sets hasMore to false when initialAfter is null', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null,
          username: 'testuser'
        })
      )

      expect(result.current.hasMore).toBe(false)
    })

    it('sets hasMore to false when initialAfter is empty string', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: '',
          username: 'testuser'
        })
      )

      expect(result.current.hasMore).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // removeItem — no intersection needed, use renderHook.
  // -------------------------------------------------------------------------

  describe('removeItem', () => {
    it('removes item by id', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null,
          username: 'testuser'
        })
      )

      act(() => {
        result.current.removeItem('saved1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].data.id).toBe('comment1')
    })

    it('handles removing non-existent item gracefully', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null,
          username: 'testuser'
        })
      )

      act(() => {
        result.current.removeItem('nonexistent')
      })

      expect(result.current.items).toHaveLength(2)
    })

    it('removes all items when called for each', () => {
      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null,
          username: 'testuser'
        })
      )

      act(() => {
        result.current.removeItem('saved1')
        result.current.removeItem('comment1')
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // Infinite scroll loading — needs the sentinel + intersection trigger.
  // -------------------------------------------------------------------------

  describe('infinite scroll loading', () => {
    it('loads more items when sentinel intersects', async () => {
      const newItem: SavedItem = {
        type: 'post',
        data: {...mockPost, id: 'saved3', title: 'Third saved post'}
      }

      mockFetchSavedItems.mockResolvedValueOnce({
        items: [newItem],
        after: null
      })

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      await act(async () => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(mockFetchSavedItems).toHaveBeenCalledWith(
          'testuser',
          't3_cursor'
        )
      })

      await waitFor(() => {
        expect(getResult().items).toHaveLength(3)
      })

      expect(getResult().items[2].data.id).toBe('saved3')
      expect(getResult().hasMore).toBe(false)
      expect(getResult().loading).toBe(false)
    })

    it('sets loading to true while fetching', async () => {
      let resolvePromise:
        | ((value: {items: SavedItem[]; after: string | null}) => void)
        | undefined

      mockFetchSavedItems.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      act(() => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().loading).toBe(true)
      })

      act(() => {
        resolvePromise?.({items: [], after: null})
      })

      await waitFor(() => {
        expect(getResult().loading).toBe(false)
      })
    })

    it('handles error during fetch', async () => {
      mockFetchSavedItems.mockRejectedValueOnce(new Error('Network error'))

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      await act(async () => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().error).toBe('Network error')
      })

      expect(getResult().hasMore).toBe(false)
      expect(getResult().loading).toBe(false)
    })

    it('sets hasMore to false when no more items', async () => {
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [],
        after: null
      })

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      await act(async () => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().hasMore).toBe(false)
      })
    })

    it('prevents race conditions when loading', async () => {
      mockFetchSavedItems.mockClear()
      mockFetchSavedItems.mockResolvedValue({
        items: [{type: 'post', data: {...mockPost, id: 'new'}}],
        after: null
      })

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      // First trigger starts the load
      act(() => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().loading).toBe(true)
      })

      // Second trigger while loading should be ignored
      act(() => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().loading).toBe(false)
      })

      expect(mockFetchSavedItems).toHaveBeenCalledTimes(1)
    })

    it('updates after cursor for pagination', async () => {
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [{type: 'post', data: {...mockPost, id: 'new'}}],
        after: 't3_next_cursor'
      })

      const {getResult} = renderWithSentinel({
        initialItems: mockItems,
        initialAfter: 't3_cursor',
        username: 'testuser'
      })

      await act(async () => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(getResult().items).toHaveLength(3)
      })

      expect(getResult().hasMore).toBe(true)

      // Next load should use the new cursor
      mockFetchSavedItems.mockClear()
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [],
        after: null
      })

      await act(async () => {
        mockObserver._trigger(true)
      })

      await waitFor(() => {
        expect(mockFetchSavedItems).toHaveBeenCalledWith(
          'testuser',
          't3_next_cursor'
        )
      })
    })
  })
})

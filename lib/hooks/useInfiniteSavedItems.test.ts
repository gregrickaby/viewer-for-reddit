import {fetchSavedItems} from '@/lib/actions/reddit'
import type {RedditComment, RedditPost, SavedItem} from '@/lib/types/reddit'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useInfiniteSavedItems} from './useInfiniteSavedItems'

vi.mock('@/lib/actions/reddit', () => ({
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

describe('useInfiniteSavedItems', () => {
  let observerCallback: IntersectionObserverCallback | null = null

  beforeEach(() => {
    mockFetchSavedItems.mockClear()
    mockFetchSavedItems.mockResolvedValue({
      items: [],
      after: null
    })

    observerCallback = null
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback?: IntersectionObserverCallback) {
        if (callback) {
          observerCallback = callback
        }
      }
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
    } as unknown as typeof IntersectionObserver
  })

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

  describe('infinite scroll loading', () => {
    beforeEach(() => {
      global.IntersectionObserver = class IntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback
        }
        observe = vi.fn()
        disconnect = vi.fn()
        unobserve = vi.fn()
      } as unknown as typeof IntersectionObserver
    })

    it('loads more items when sentinel intersects', async () => {
      const newItem: SavedItem = {
        type: 'post',
        data: {...mockPost, id: 'saved3', title: 'Third saved post'}
      }

      mockFetchSavedItems.mockResolvedValueOnce({
        items: [newItem],
        after: null
      })

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      await act(async () => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(mockFetchSavedItems).toHaveBeenCalledWith(
          'testuser',
          't3_cursor'
        )
      })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3)
      })

      expect(result.current.items[2].data.id).toBe('saved3')
      expect(result.current.hasMore).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('sets loading to true while fetching', async () => {
      let resolvePromise: ((value: any) => void) | undefined

      mockFetchSavedItems.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      act(() => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      act(() => {
        resolvePromise?.({items: [], after: null})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('handles error during fetch', async () => {
      mockFetchSavedItems.mockRejectedValueOnce(new Error('Network error'))

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      await act(async () => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      expect(result.current.hasMore).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('sets hasMore to false when no more items', async () => {
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [],
        after: null
      })

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      await act(async () => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false)
      })
    })

    it('prevents race conditions when loading', async () => {
      mockFetchSavedItems.mockClear()
      mockFetchSavedItems.mockResolvedValue({
        items: [{type: 'post', data: {...mockPost, id: 'new'}}],
        after: null
      })

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      // Trigger load
      act(() => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Try to trigger again while loading (should be ignored)
      act(() => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should only have called fetchSavedItems once
      expect(mockFetchSavedItems).toHaveBeenCalledTimes(1)
    })

    it('does not load when hasMore is false', async () => {
      renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: null, // No more items
          username: 'testuser'
        })
      )

      // IntersectionObserver should not be created when hasMore is false initially
      // No sentinelRef call needed since hasMore is false

      // observerCallback will be null since observer is not created with hasMore=false
      expect(observerCallback).toBeNull()
    })

    it('updates after cursor for pagination', async () => {
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [{type: 'post', data: {...mockPost, id: 'new'}}],
        after: 't3_next_cursor'
      })

      const {result} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      await waitFor(() => {
        expect(observerCallback).not.toBeNull()
      })

      await act(async () => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true)
      })

      // Wait for after state to update
      await waitFor(() => {
        expect(result.current.items).toHaveLength(3) // 2 initial + 1 new
      })

      // Next load should use new cursor
      mockFetchSavedItems.mockClear()
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [],
        after: null
      })

      await act(async () => {
        observerCallback?.(
          [{isIntersecting: true}] as IntersectionObserverEntry[],
          {} as IntersectionObserver
        )
      })

      await waitFor(() => {
        expect(mockFetchSavedItems).toHaveBeenCalledWith(
          'testuser',
          't3_next_cursor'
        )
      })
    })
  })

  describe('cleanup', () => {
    it('disconnects observer on unmount', () => {
      const disconnectSpy = vi.fn()

      const IntersectionObserverMock = vi.fn()
      IntersectionObserverMock.prototype.observe = vi.fn()
      IntersectionObserverMock.prototype.disconnect = disconnectSpy
      IntersectionObserverMock.prototype.unobserve = vi.fn()

      global.IntersectionObserver = IntersectionObserverMock as any

      const {result, unmount} = renderHook(() =>
        useInfiniteSavedItems({
          initialItems: mockItems,
          initialAfter: 't3_cursor',
          username: 'testuser'
        })
      )

      // Trigger IntersectionObserver creation
      const mockElement = document.createElement('div')
      act(() => {
        result.current.sentinelRef(mockElement)
      })

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })
})

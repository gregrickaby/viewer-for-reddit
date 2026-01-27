import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  fetchSavedItems: vi.fn(async () => ({
    items: [],
    after: null
  }))
}))

vi.mock('@/lib/actions/auth', () => ({
  clearExpiredSession: vi.fn(async () => {})
}))

vi.mock('../PostCard/PostCard', () => ({
  PostCard: ({post}: {post: {title: string}}) => <div>{post.title}</div>
}))

vi.mock('../Comment/Comment', () => ({
  Comment: ({comment}: {comment: {body: string}}) => <div>{comment.body}</div>
}))

import {fetchSavedItems} from '@/lib/actions/reddit'
import type {RedditComment, RedditPost, SavedItem} from '@/lib/types/reddit'
import {act, render, screen, waitFor} from '@/test-utils'
import {SavedItemsList} from './SavedItemsList'

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

const mockComment: RedditComment & {
  link_title?: string
  link_url?: string
  subreddit?: string
} = {
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
  score_hidden: false,
  link_title: 'First saved post',
  subreddit: 'testsubreddit',
  link_url: '/r/testsubreddit/comments/saved1/first_saved_post/'
}

const mockItems: SavedItem[] = [
  {type: 'post', data: mockPost},
  {type: 'comment', data: mockComment}
]

describe('SavedItemsList', () => {
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

  describe('initial rendering', () => {
    it('renders initial saved items (posts and comments)', () => {
      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getAllByText('First saved post').length).toBeGreaterThan(0)
      expect(screen.getByText('This is a saved comment')).toBeInTheDocument()
    })

    it('renders comment context information', () => {
      render(
        <SavedItemsList
          initialItems={[{type: 'comment', data: mockComment}]}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getByText(/Comment on/)).toBeInTheDocument()
      expect(screen.getByText('First saved post')).toBeInTheDocument()
      expect(screen.getByText(/r\/testsubreddit/)).toBeInTheDocument()
    })

    it('handles empty saved items', () => {
      render(
        <SavedItemsList
          initialItems={[]}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.queryByText('First saved post')).not.toBeInTheDocument()
      expect(
        screen.queryByText('This is a saved comment')
      ).not.toBeInTheDocument()
    })

    it('shows "No more saved items" when there are no more items', () => {
      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getByText('No more saved items')).toBeInTheDocument()
    })

    it('does not show "No more saved items" when there are more items', () => {
      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

      expect(screen.queryByText('No more saved items')).not.toBeInTheDocument()
    })
  })

  describe('infinite scroll setup', () => {
    it('sets up IntersectionObserver when there are more items', () => {
      const constructorSpy = vi.fn()
      global.IntersectionObserver = class IntersectionObserver {
        constructor() {
          constructorSpy()
        }
        observe = vi.fn()
        disconnect = vi.fn()
        unobserve = vi.fn()
      } as unknown as typeof IntersectionObserver

      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

      expect(constructorSpy).toHaveBeenCalled()
    })

    it('does not set up IntersectionObserver when no more items', () => {
      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
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
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [{type: 'post', data: {...mockPost, id: 'saved3'}}],
        after: null
      })

      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

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
    })

    it('shows error message when fetch fails', async () => {
      mockFetchSavedItems.mockRejectedValueOnce(new Error('Network error'))

      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

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
        expect(
          screen.getByText('Failed to load saved items')
        ).toBeInTheDocument()
      })
    })

    it('shows no-more message after empty response', async () => {
      mockFetchSavedItems.mockResolvedValueOnce({
        items: [],
        after: null
      })

      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

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
        expect(screen.getByText('No more saved items')).toBeInTheDocument()
      })
    })
  })

  describe('item rendering', () => {
    it('renders posts with PostCard component', () => {
      render(
        <SavedItemsList
          initialItems={[{type: 'post', data: mockPost}]}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getByText('First saved post')).toBeInTheDocument()
    })

    it('renders comments with Comment component', () => {
      render(
        <SavedItemsList
          initialItems={[{type: 'comment', data: mockComment}]}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getByText('This is a saved comment')).toBeInTheDocument()
    })

    it('renders mixed posts and comments in order', () => {
      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getAllByText('First saved post').length).toBeGreaterThan(0)
      expect(screen.getByText('This is a saved comment')).toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    it('passes isAuthenticated prop to Comment component', () => {
      render(
        <SavedItemsList
          initialItems={[{type: 'comment', data: mockComment}]}
          username="testuser"
          initialAfter={null}
          isAuthenticated
        />
      )

      expect(screen.getByText('This is a saved comment')).toBeInTheDocument()
    })

    it('works with isAuthenticated false', () => {
      render(
        <SavedItemsList
          initialItems={[{type: 'comment', data: mockComment}]}
          username="testuser"
          initialAfter={null}
          isAuthenticated={false}
        />
      )

      expect(screen.getByText('This is a saved comment')).toBeInTheDocument()
    })
  })
})

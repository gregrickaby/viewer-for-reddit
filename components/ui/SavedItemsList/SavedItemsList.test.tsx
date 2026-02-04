import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock hooks
vi.mock('@/lib/hooks', () => ({
  useInfiniteSavedItems: vi.fn(() => ({
    items: [],
    loading: false,
    hasMore: false,
    error: null,
    sentinelRef: vi.fn(),
    removeItem: vi.fn()
  }))
}))

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

import {useInfiniteSavedItems} from '@/lib/hooks'
import type {RedditComment, RedditPost, SavedItem} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {SavedItemsList} from './SavedItemsList'

const mockUseInfiniteSavedItems = vi.mocked(useInfiniteSavedItems)

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
  beforeEach(() => {
    mockUseInfiniteSavedItems.mockReturnValue({
      items: mockItems,
      loading: false,
      hasMore: false,
      error: null,
      sentinelRef: vi.fn(),
      removeItem: vi.fn()
    })
  })

  describe('rendering', () => {
    it('renders saved items from hook', () => {
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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [{type: 'comment', data: mockComment}],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: mockItems,
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: mockItems,
        loading: false,
        hasMore: true,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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

    it('shows loading indicator when loading', () => {
      mockUseInfiniteSavedItems.mockReturnValue({
        items: mockItems,
        loading: true,
        hasMore: true,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

      render(
        <SavedItemsList
          initialItems={mockItems}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

      // Mantine Loader doesn't have specific aria role, just check it renders
      const loader = document.querySelector('.mantine-Loader-root')
      expect(loader).toBeInTheDocument()
    })

    it('shows error message when error occurs', () => {
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [],
        loading: false,
        hasMore: false,
        error: 'Network error',
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

      render(
        <SavedItemsList
          initialItems={[]}
          username="testuser"
          initialAfter="t3_cursor"
          isAuthenticated
        />
      )

      expect(screen.getByText('Failed to load saved items')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  describe('item rendering', () => {
    it('renders posts with PostCard component', () => {
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [{type: 'post', data: mockPost}],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [{type: 'comment', data: mockComment}],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: mockItems,
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
    it('passes isAuthenticated prop to child components', () => {
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [{type: 'comment', data: mockComment}],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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
      mockUseInfiniteSavedItems.mockReturnValue({
        items: [{type: 'comment', data: mockComment}],
        loading: false,
        hasMore: false,
        error: null,
        sentinelRef: vi.fn(),
        removeItem: vi.fn()
      })

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

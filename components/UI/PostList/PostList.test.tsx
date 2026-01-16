import * as hooks from '@/lib/hooks'
import type {RedditPost} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock hooks before importing component
vi.mock('@/lib/hooks', () => ({
  useInfiniteScroll: vi.fn(),
  useVote: vi.fn(() => ({
    voteState: 0 as 0 | 1 | -1 | null,
    score: 100,
    isPending: false,
    vote: vi.fn()
  })),
  useSavePost: vi.fn(() => ({
    isSaved: false,
    isPending: false,
    toggleSave: vi.fn()
  }))
}))

const {PostList} = await import('./PostList')

const mockPost: RedditPost = {
  id: 'post1',
  name: 't3_post1',
  title: 'Test Post 1',
  author: 'testuser',
  subreddit: 'test',
  subreddit_name_prefixed: 'r/test',
  permalink: '/r/test/comments/post1/test_post_1/',
  created_utc: Date.now() / 1000 - 3600,
  score: 100,
  num_comments: 42,
  thumbnail: '',
  url: 'https://reddit.com/r/test/comments/post1/',
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  ups: 100,
  downs: 0
}

const mockPost2 = {
  ...mockPost,
  id: 'post2',
  name: 't3_post2',
  title: 'Test Post 2'
}

describe('PostList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders list of posts', () => {
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [mockPost, mockPost2],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost, mockPost2]} />)

      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 2')).toBeInTheDocument()
    })

    it('renders empty list', () => {
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[]} />)

      // No posts or "no more" message
      expect(screen.queryByText(/no more posts/i)).not.toBeInTheDocument()
    })

    it('passes isAuthenticated to PostCard', () => {
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [mockPost],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost]} isAuthenticated />)

      // Check for vote buttons (only visible when authenticated)
      expect(screen.getByRole('button', {name: /upvote/i})).toBeInTheDocument()
    })
  })

  describe('infinite scroll', () => {
    it('shows loader when more posts available', () => {
      const mockRef = {current: null}
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [mockPost],
        hasMore: true,
        loading: false,
        sentinelRef: mockRef as any
      })

      const {container} = render(
        <PostList initialPosts={[mockPost]} initialAfter="t3_after" />
      )

      // Mantine Loader may not have progressbar role
      // eslint-disable-next-line testing-library/no-container
      const loader = container.querySelector('.mantine-Loader-root')
      expect(loader).toBeInTheDocument()
    })

    it('shows no more posts message when list complete', () => {
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [mockPost, mockPost2],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost, mockPost2]} />)

      expect(screen.getByText('No more posts')).toBeInTheDocument()
    })

    it('does not show no more message for empty list', () => {
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[]} />)

      expect(screen.queryByText('No more posts')).not.toBeInTheDocument()
    })

    it('attaches sentinel ref for infinite scroll', () => {
      const mockRef = {current: null}
      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: [mockPost],
        hasMore: true,
        loading: false,
        sentinelRef: mockRef as any
      })

      const {container} = render(
        <PostList initialPosts={[mockPost]} initialAfter="t3_after" />
      )

      // Sentinel element should be rendered
      // eslint-disable-next-line testing-library/no-container
      const sentinel = container.querySelector('[class*="sentinel"]')
      expect(sentinel).toBeInTheDocument()
    })
  })

  describe('hook integration', () => {
    it('passes initialPosts to useInfiniteScroll', () => {
      const mockUseInfiniteScroll = vi.mocked(hooks.useInfiniteScroll)
      mockUseInfiniteScroll.mockReturnValue({
        posts: [mockPost],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost]} />)

      expect(mockUseInfiniteScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPosts: [mockPost]
        })
      )
    })

    it('passes initialAfter to useInfiniteScroll', () => {
      const mockUseInfiniteScroll = vi.mocked(hooks.useInfiniteScroll)
      mockUseInfiniteScroll.mockReturnValue({
        posts: [mockPost],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost]} initialAfter="t3_after123" />)

      expect(mockUseInfiniteScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          initialAfter: 't3_after123'
        })
      )
    })

    it('disables infinite scroll when searchQuery is provided', () => {
      const mockUseInfiniteScroll = vi.mocked(hooks.useInfiniteScroll)
      mockUseInfiniteScroll.mockReturnValue({
        posts: [mockPost],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost]} searchQuery="test query" />)

      // Infinite scroll should be disabled (initialAfter set to null)
      expect(mockUseInfiniteScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          initialAfter: null
        })
      )
    })

    it('disables infinite scroll when username is provided', () => {
      const mockUseInfiniteScroll = vi.mocked(hooks.useInfiniteScroll)
      mockUseInfiniteScroll.mockReturnValue({
        posts: [mockPost],
        hasMore: false,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={[mockPost]} username="testuser" />)

      // Infinite scroll should be disabled (initialAfter set to null)
      expect(mockUseInfiniteScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          initialAfter: null
        })
      )
    })
  })

  describe('edge cases', () => {
    it('handles many posts', () => {
      const manyPosts = Array.from({length: 100}, (_, i) => ({
        ...mockPost,
        id: `post${i}`,
        name: `t3_post${i}`,
        title: `Post ${i}`
      }))

      vi.mocked(hooks.useInfiniteScroll).mockReturnValue({
        posts: manyPosts,
        hasMore: true,
        loading: false,
        sentinelRef: {current: null} as any
      })

      render(<PostList initialPosts={manyPosts} />)

      expect(screen.getByText('Post 0')).toBeInTheDocument()
      expect(screen.getByText('Post 99')).toBeInTheDocument()
    })
  })
})

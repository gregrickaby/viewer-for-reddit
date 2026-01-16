import type {RedditPost} from '@/lib/types/reddit'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn()
  }),
  usePathname: () => '/r/test'
}))

vi.mock('@/lib/hooks', () => ({
  useVote: vi.fn(() => ({
    voteState: 0,
    score: 100,
    isPending: false,
    vote: vi.fn()
  })),
  useSavePost: vi.fn(() => ({
    isSaved: false,
    isPending: false,
    toggleSave: vi.fn()
  })),
  useInfiniteScroll: vi.fn(({initialPosts}) => ({
    posts: initialPosts,
    hasMore: false,
    loading: false,
    sentinelRef: vi.fn()
  }))
}))

const {PostListWithTabs} = await import('./PostListWithTabs')

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

describe('PostListWithTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tabs rendering', () => {
    it('renders all sort tabs', () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      expect(screen.getByRole('tab', {name: /hot/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /new/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /top/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /rising/i})).toBeInTheDocument()
    })

    it('marks active tab correctly', () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="new" />)

      const newTab = screen.getByRole('tab', {name: /new/i})
      expect(newTab).toHaveAttribute('data-active', 'true')
    })

    it('renders tab icons', () => {
      const {container} = render(
        <PostListWithTabs posts={[mockPost]} activeSort="hot" />
      )

      // Check for SVG icons in tabs
      // eslint-disable-next-line testing-library/no-container
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('sort navigation', () => {
    it('navigates when clicking hot tab', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="new" />)

      const hotTab = screen.getByRole('tab', {name: /hot/i})
      await user.click(hotTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=hot')
    })

    it('navigates when clicking new tab', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      const newTab = screen.getByRole('tab', {name: /new/i})
      await user.click(newTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=new')
    })

    it('navigates when clicking top tab', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      const topTab = screen.getByRole('tab', {name: /top/i})
      await user.click(topTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=top')
    })

    it('navigates when clicking rising tab', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      const risingTab = screen.getByRole('tab', {name: /rising/i})
      await user.click(risingTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=rising')
    })
  })

  describe('posts rendering', () => {
    it('renders post cards', () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    })

    it('renders multiple posts', () => {
      const posts = [
        mockPost,
        {...mockPost, id: 'post2', title: 'Test Post 2', name: 't3_post2'}
      ]

      render(<PostListWithTabs posts={posts} activeSort="hot" />)

      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 2')).toBeInTheDocument()
    })

    it('passes isAuthenticated to PostCard', () => {
      render(
        <PostListWithTabs posts={[mockPost]} activeSort="hot" isAuthenticated />
      )

      // Check for vote buttons (only visible when authenticated)
      expect(screen.getByRole('button', {name: /upvote/i})).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty posts array', () => {
      render(<PostListWithTabs posts={[]} activeSort="hot" />)

      expect(screen.getByRole('tab', {name: /hot/i})).toBeInTheDocument()
      expect(screen.queryByText(/test post/i)).not.toBeInTheDocument()
    })

    it('handles all sort options', () => {
      const sorts: Array<'hot' | 'new' | 'top' | 'rising'> = [
        'hot',
        'new',
        'top',
        'rising'
      ]

      sorts.forEach((sort) => {
        const {unmount} = render(
          <PostListWithTabs posts={[mockPost]} activeSort={sort} />
        )

        const tab = screen.getByRole('tab', {name: new RegExp(sort, 'i')})
        expect(tab).toHaveAttribute('data-active', 'true')

        unmount()
      })
    })
  })
})

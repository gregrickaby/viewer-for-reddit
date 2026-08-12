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
  })),
  useSharePost: vi.fn(() => ({
    sharePost: vi.fn()
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
    it('renders all sort options in the dropdown', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))

      expect(await screen.findByText('New')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Rising')).toBeInTheDocument()
    })

    it('shows the active sort on the trigger button', () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="new" />)

      expect(
        screen.getByRole('button', {name: /sort by new/i})
      ).toBeInTheDocument()
    })

    it('renders tab icons', async () => {
      const {container} = render(
        <PostListWithTabs posts={[mockPost]} activeSort="hot" />
      )

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))
      await screen.findByText('New')

      // eslint-disable-next-line testing-library/no-container
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('sort navigation', () => {
    it('navigates when clicking hot option', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="new" />)

      await user.click(screen.getByRole('button', {name: /sort by new/i}))
      await user.click(await screen.findByText('Hot'))

      expect(mockPush).toHaveBeenCalledWith('?sort=hot')
    })

    it('navigates when clicking new option', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))
      await user.click(await screen.findByText('New'))

      expect(mockPush).toHaveBeenCalledWith('?sort=new')
    })

    it('navigates when clicking top option', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))
      await user.click(await screen.findByText('Top'))

      expect(mockPush).toHaveBeenCalledWith('?sort=top&time=week')
    })

    it('navigates when clicking rising option', async () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="hot" />)

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))
      await user.click(await screen.findByText('Rising'))

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
  })

  describe('edge cases', () => {
    it('handles empty posts array', () => {
      render(<PostListWithTabs posts={[]} activeSort="hot" />)

      expect(
        screen.getByRole('button', {name: /sort by hot/i})
      ).toBeInTheDocument()
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

        expect(
          screen.getByRole('button', {name: new RegExp(`sort by ${sort}`, 'i')})
        ).toBeInTheDocument()

        unmount()
      })
    })
  })

  describe('time filter', () => {
    it('shows time filter when sort is top', async () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="top"
          activeTimeFilter="day"
        />
      )

      const timeTrigger = screen.getByRole('button', {
        name: /filter by time day/i
      })
      await user.click(timeTrigger)

      expect(await screen.findByText('Hour')).toBeInTheDocument()
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
      expect(screen.getByText('All Time')).toBeInTheDocument()
    })

    it('shows time filter when sort is controversial', () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="controversial"
          activeTimeFilter="week"
        />
      )

      expect(
        screen.getByRole('button', {name: /filter by time week/i})
      ).toBeInTheDocument()
    })

    it.each(['hot', 'new', 'rising'] as const)(
      'does not show time filter when sort is %s',
      (sort) => {
        render(<PostListWithTabs posts={[mockPost]} activeSort={sort} />)

        expect(
          screen.queryByRole('button', {name: /filter by time/i})
        ).not.toBeInTheDocument()
      }
    )

    it('navigates with time filter when clicking time option', async () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="top"
          activeTimeFilter="day"
        />
      )

      await user.click(
        screen.getByRole('button', {name: /filter by time day/i})
      )
      await user.click(await screen.findByText('Week'))

      expect(mockPush).toHaveBeenCalledWith('?sort=top&time=week')
    })

    it('preserves time filter when switching to top', async () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="hot"
          activeTimeFilter="week"
        />
      )

      await user.click(screen.getByRole('button', {name: /sort by hot/i}))
      await user.click(await screen.findByText('Top'))

      expect(mockPush).toHaveBeenCalledWith('?sort=top&time=week')
    })

    it('preserves time filter when switching to controversial', async () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="new"
          activeTimeFilter="month"
        />
      )

      // Note: controversial not rendered in basic PostListWithTabs's sort
      // dropdown. This test would apply if we add controversial to the tabs.
      await user.click(screen.getByRole('button', {name: /sort by new/i}))
      await user.click(await screen.findByText('Top'))

      expect(mockPush).toHaveBeenCalledWith('?sort=top&time=month')
    })

    it('does not include time param when switching to hot', async () => {
      render(
        <PostListWithTabs
          posts={[mockPost]}
          activeSort="top"
          activeTimeFilter="week"
        />
      )

      await user.click(screen.getByRole('button', {name: /sort by top/i}))
      await user.click(await screen.findByText('Hot'))

      expect(mockPush).toHaveBeenCalledWith('?sort=hot')
    })

    it('uses default time filter of week when not provided', () => {
      render(<PostListWithTabs posts={[mockPost]} activeSort="top" />)

      expect(
        screen.getByRole('button', {name: /filter by time week/i})
      ).toBeInTheDocument()
    })
  })
})

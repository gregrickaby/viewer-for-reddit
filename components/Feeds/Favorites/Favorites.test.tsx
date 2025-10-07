import {Favorites} from '@/components/Feeds/Favorites/Favorites'
import {render, screen} from '@/test-utils'

const {mockUseInfinitePosts} = vi.hoisted(() => ({
  mockUseInfinitePosts: vi.fn()
}))

vi.mock('@/lib/hooks/useInfinitePosts', () => ({
  useInfinitePosts: mockUseInfinitePosts
}))

vi.mock('@/components/UI/Post/Card', () => ({
  Card: ({post}: any) => <div data-testid="post-card">{post.id}</div>
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Loader: () => <div data-testid="loader" />
  }
})

describe('FavoritePosts', () => {
  beforeEach(() => {
    mockUseInfinitePosts.mockReturnValue({
      data: {
        pages: [
          {
            data: {
              children: [
                {
                  data: {
                    id: 'test1',
                    title: 'Test Post 1',
                    author: 'testuser',
                    subreddit: 'gaming',
                    created_utc: 1234567890,
                    score: 100,
                    num_comments: 10,
                    url: 'https://reddit.com/test1',
                    permalink: '/r/gaming/comments/test1',
                    stickied: false,
                    over_18: false
                  }
                }
              ]
            }
          }
        ]
      },
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: {current: null},
      wasFiltered: false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should combine multiple favorite subreddits with + syntax', () => {
    const favorites = ['gaming', 'technology', 'askreddit']
    render(<Favorites favorites={favorites} sort="hot" />)

    // Verify useInfinitePosts was called with combined subreddits
    expect(mockUseInfinitePosts).toHaveBeenCalledWith({
      subreddit: 'gaming+technology+askreddit',
      sort: 'hot'
    })
  })

  it('should handle single favorite subreddit correctly', () => {
    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="new" />)

    // Verify useInfinitePosts was called with single subreddit
    expect(mockUseInfinitePosts).toHaveBeenCalledWith({
      subreddit: 'gaming',
      sort: 'new'
    })
  })

  it('should fallback to "all" when no favorites provided', () => {
    const favorites: string[] = []
    render(<Favorites favorites={favorites} sort="top" />)

    // Verify useInfinitePosts was called with fallback
    expect(mockUseInfinitePosts).toHaveBeenCalledWith({
      subreddit: 'all',
      sort: 'top'
    })
  })

  it('should display the correct feed title and subreddit count', () => {
    const favorites = ['gaming', 'technology']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(screen.getByRole('heading', {name: /my feed/i})).toBeInTheDocument()
    expect(screen.getByText('2 subreddits')).toBeInTheDocument()
  })

  it('should display singular "subreddit" for single favorite', () => {
    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(screen.getByText('1 subreddit')).toBeInTheDocument()
  })

  it('should render post cards when data is available', () => {
    const favorites = ['gaming', 'technology']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(screen.getByTestId('post-card')).toBeInTheDocument()
    expect(screen.getByText('test1')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: null,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: true,
      noVisiblePosts: false,
      ref: {current: null},
      wasFiltered: false
    })

    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: null,
      error: {message: 'Network error'},
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: {current: null},
      wasFiltered: false
    })

    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(
      screen.getByRole('heading', {name: /unable to load posts from reddit/i})
    ).toBeInTheDocument()
  })

  it('should show no posts message when no visible posts', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: null,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: true,
      ref: {current: null},
      wasFiltered: false
    })

    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(
      screen.getByRole('heading', {
        name: /no posts found from your favorite subreddits/i
      })
    ).toBeInTheDocument()
  })

  it('should show NSFW message when posts were filtered', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: null,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: true,
      ref: {current: null},
      wasFiltered: true
    })

    const favorites = ['gaming']
    render(<Favorites favorites={favorites} sort="hot" />)

    expect(
      screen.getByRole('heading', {
        name: /you need to enable the "allow nsfw" setting/i
      })
    ).toBeInTheDocument()
  })
})

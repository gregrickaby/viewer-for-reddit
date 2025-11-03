import {Subreddit} from '@/components/Feeds/Subreddit/Subreddit'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/hooks/subreddit/useTrackRecentSubreddit', () => ({
  useTrackRecentSubreddit: () => {}
}))

const {mockUseInfinitePosts} = vi.hoisted(() => ({
  mockUseInfinitePosts: vi.fn()
}))
vi.mock('@/lib/hooks/feed/useInfinitePosts', () => ({
  useInfinitePosts: mockUseInfinitePosts
}))

vi.mock('@/components/UI/Post/Card/Card', () => ({
  Card: ({post}: any) => <div data-testid="post-card">{post.id}</div>
}))

vi.mock('@/components/UI/Favorite/Favorite', () => ({
  Favorite: () => <div data-testid="favorite" />
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Loader: () => <div data-testid="loader" />,
    Button: ({children, fullWidth, ...props}: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Code: ({children}: any) => <pre>{children}</pre>,
    Group: ({children, ...props}: any) => <div {...props}>{children}</div>,
    Container: ({children, ...props}: any) => <div {...props}>{children}</div>,
    Stack: ({children, ...props}: any) => <div {...props}>{children}</div>,
    Title: ({children, ...props}: any) => <h1 {...props}>{children}</h1>,
    SegmentedControl: ({data, value, onChange}: any) => (
      <div>
        {data.map((item: any) => (
          <button
            type="button"
            key={item.value}
            onClick={() => onChange(item.value)}
            aria-label={item.label}
            style={{fontWeight: value === item.value ? 'bold' : 'normal'}}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Subreddit', () => {
  it('shows loader when loading', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: undefined,
      error: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: true,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="test" />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('shows error message when request fails', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: {pages: [], pageParams: []},
      error: {status: 500, message: 'Internal Server Error'},
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="test" />)
    expect(screen.getByText(/Subreddit Not Available/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Reddit servers are experiencing issues. Please try again later./
      )
    ).toBeInTheDocument()
  })

  it('shows 404 error message for non-existent subreddit', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: undefined,
      error: {status: 404},
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="nonexistent" />)
    expect(screen.getByText(/Subreddit Not Available/)).toBeInTheDocument()
    expect(
      screen.getByText(/Subreddit r\/nonexistent not found/)
    ).toBeInTheDocument()
  })

  it('shows 403 error message for private subreddit', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: undefined,
      error: {status: 403},
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="private" />)
    expect(screen.getByText(/Subreddit Not Available/)).toBeInTheDocument()
    expect(
      screen.getByText(/Subreddit r\/private is private or restricted/)
    ).toBeInTheDocument()
  })

  it('shows no posts message when noVisiblePosts and not filtered', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: undefined,
      error: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: true,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="test" />)
    expect(
      screen.getByText('No posts found! Try a different subreddit')
    ).toBeInTheDocument()
  })

  it('shows nsfw message when filtered', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: undefined,
      error: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: true,
      ref: vi.fn(),
      wasFiltered: true
    })
    render(<Subreddit subreddit="test" />)
    expect(
      screen.getByText(
        'You need to enable the "Allow NSFW" setting to see posts'
      )
    ).toBeInTheDocument()
  })

  it('renders posts and handles load more', async () => {
    const fetchNextPage = vi.fn()
    mockUseInfinitePosts.mockReturnValue({
      data: {
        pages: [
          {
            data: {
              children: [{data: {id: '1'}}, {data: {id: '2'}}, {data: null}]
            }
          },
          {data: null}
        ]
      },
      error: undefined,
      fetchNextPage,
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    const user = userEvent.setup()
    render(<Subreddit subreddit="test" />)
    expect(screen.getAllByTestId('post-card')).toHaveLength(2)
    await user.click(screen.getByRole('button', {name: 'Load More'}))
    expect(fetchNextPage).toHaveBeenCalled()
    await user.click(screen.getByRole('button', {name: 'New'}))
  })

  it('shows loader when fetching next page', () => {
    mockUseInfinitePosts.mockReturnValue({
      data: {
        pages: [
          {
            data: {
              children: []
            }
          }
        ]
      },
      error: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: true,
      isLoading: false,
      noVisiblePosts: false,
      ref: vi.fn(),
      wasFiltered: false
    })
    render(<Subreddit subreddit="test" />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})

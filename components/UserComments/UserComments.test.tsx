import {render, screen} from '@/test-utils'
import {vi} from 'vitest'
import {UserComments} from './UserComments'

// Mock the hook using hoisted pattern
const mockUseInfiniteUserComments = vi.hoisted(() => vi.fn())

vi.mock('@/lib/hooks/useInfiniteUserComments', () => ({
  useInfiniteUserComments: mockUseInfiniteUserComments
}))

describe('UserComments', () => {
  beforeEach(() => {
    mockUseInfiniteUserComments.mockReset()
  })

  it('should show loading state when comments are loading', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [],
      isLoading: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('should show error state when there is an error', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [],
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: new Error('Test error'),
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(screen.getByText('Error loading comments')).toBeInTheDocument()
  })

  it('should show NSFW filter message when comments are filtered', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [],
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: true,
      wasFiltered: true,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(
      screen.getByText(/All comments from this user are NSFW/)
    ).toBeInTheDocument()
  })

  it('should show no comments message when no comments found', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [],
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(
      screen.getByText('No comments found for this user.')
    ).toBeInTheDocument()
  })

  it('should render comments when data is available', () => {
    const mockComments = [
      {
        data: {
          id: 'comment1',
          subreddit: 'testsubreddit',
          score: 42,
          created_utc: 1640995200, // Jan 1, 2022
          link_title: 'Test Post Title',
          body: 'This is a test comment',
          body_html: '<p>This is a test comment</p>',
          permalink: '/r/testsubreddit/comments/123/test/comment1/'
        }
      }
    ]

    mockUseInfiniteUserComments.mockReturnValue({
      comments: mockComments,
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(screen.getByText('in r/testsubreddit')).toBeInTheDocument()
    expect(screen.getByText('Re: Test Post Title')).toBeInTheDocument()
    expect(screen.getByText('View on Reddit')).toBeInTheDocument()
  })

  it('should show load more button when there are more pages', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [
        {
          data: {
            id: 'comment1',
            subreddit: 'testsubreddit',
            score: 42,
            created_utc: 1640995200,
            body: 'Test comment'
          }
        }
      ],
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(
      screen.getByRole('button', {name: 'Load More Comments'})
    ).toBeInTheDocument()
  })

  it('should show loading next page message when fetching more', () => {
    mockUseInfiniteUserComments.mockReturnValue({
      comments: [
        {
          data: {
            id: 'comment1',
            subreddit: 'testsubreddit',
            score: 42,
            created_utc: 1640995200,
            body: 'Test comment'
          }
        }
      ],
      isLoading: false,
      isFetchingNextPage: true,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      error: null,
      noVisibleComments: false,
      wasFiltered: false,
      loadMoreRef: {current: null}
    })

    render(<UserComments username="testuser" sort="new" />)

    expect(screen.getByText('Loading more comments...')).toBeInTheDocument()
  })
})

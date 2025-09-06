import {Posts} from '@/components/Posts/Posts'
import {render, screen} from '@/test-utils'

vi.mock('@/lib/hooks/useTrackRecentSubreddit', () => ({
  useTrackRecentSubreddit: () => {}
}))

vi.mock('@/lib/hooks/useInfinitePosts', () => ({
  useInfinitePosts: () => ({
    data: undefined,
    error: {message: 'error'},
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isError: true,
    isFetchingNextPage: false,
    isLoading: false,
    noVisiblePosts: false,
    ref: vi.fn(),
    wasFiltered: false
  })
}))

describe('Posts', () => {
  it('shows error message when request fails', () => {
    render(<Posts subreddit="test" />)
    expect(
      screen.getByText(/Unable to load posts from Reddit/i)
    ).toBeInTheDocument()
  })
})

import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useRecentPosts, type RecentPostEntry} from '@/lib/hooks/useRecentPosts'
import {RecentPostsRail} from './RecentPostsRail'

vi.mock('@/lib/hooks/useRecentPosts', () => ({
  useRecentPosts: vi.fn()
}))

const mockUseRecentPosts = vi.mocked(useRecentPosts)

const mockEntry: RecentPostEntry = {
  id: 'abc123',
  subreddit: 'test',
  subredditPrefixed: 'r/test',
  title: 'A recently visited post',
  author: 'someuser',
  permalink: '/r/test/comments/abc123/a_recently_visited_post/',
  thumbnail: '',
  score: 1200,
  numComments: 34,
  visitedAt: Math.floor(Date.now() / 1000) - 120
}

describe('RecentPostsRail', () => {
  const mockClearRecentPosts = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there are no recent posts', () => {
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [],
      addRecentPost: vi.fn(),
      clearRecentPosts: mockClearRecentPosts
    })

    render(
      <div data-testid="wrapper">
        <RecentPostsRail />
      </div>
    )

    expect(screen.getByTestId('wrapper')).toBeEmptyDOMElement()
  })

  it('renders each recent post entry with a link to its permalink', () => {
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [mockEntry],
      addRecentPost: vi.fn(),
      clearRecentPosts: mockClearRecentPosts
    })

    render(<RecentPostsRail />)

    expect(screen.getByText('A recently visited post')).toBeInTheDocument()
    const link = screen.getByRole('link')
    // next/link normalizes away the trailing slash.
    expect(link).toHaveAttribute(
      'href',
      '/r/test/comments/abc123/a_recently_visited_post'
    )
  })

  it('renders a thumbnail image when the entry has a valid thumbnail', () => {
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [{...mockEntry, thumbnail: 'https://example.com/thumb.jpg'}],
      addRecentPost: vi.fn(),
      clearRecentPosts: mockClearRecentPosts
    })

    render(<RecentPostsRail />)

    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    )
  })

  it('omits the thumbnail image when the thumbnail is invalid', () => {
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [{...mockEntry, thumbnail: 'self'}],
      addRecentPost: vi.fn(),
      clearRecentPosts: mockClearRecentPosts
    })

    render(<RecentPostsRail />)

    expect(screen.queryByAltText('')).not.toBeInTheDocument()
  })

  it('calls clearRecentPosts when Clear is clicked', async () => {
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [mockEntry],
      addRecentPost: vi.fn(),
      clearRecentPosts: mockClearRecentPosts
    })

    render(<RecentPostsRail />)

    await user.click(screen.getByRole('button', {name: 'Clear recent posts'}))

    expect(mockClearRecentPosts).toHaveBeenCalledTimes(1)
  })
})

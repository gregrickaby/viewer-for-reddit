import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {RedditPost} from '@/lib/types/reddit'
import {useRecentPosts} from '@/lib/hooks/useRecentPosts'
import {RecordRecentPost} from './RecordRecentPost'

vi.mock('@/lib/hooks/useRecentPosts', () => ({
  useRecentPosts: vi.fn()
}))

const mockUseRecentPosts = vi.mocked(useRecentPosts)

const mockPost: RedditPost = {
  id: 'post1',
  name: 't3_post1',
  title: 'Test post',
  author: 'someuser',
  subreddit: 'test',
  subreddit_name_prefixed: 'r/test',
  permalink: '/r/test/comments/post1/test_post/',
  created_utc: Date.now() / 1000,
  score: 10,
  num_comments: 2,
  selftext: '',
  selftext_html: '',
  thumbnail: '',
  url: 'https://reddit.com/r/test/comments/post1/',
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  ups: 10,
  downs: 0
}

describe('RecordRecentPost', () => {
  const mockAddRecentPost = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecentPosts.mockReturnValue({
      recentPosts: [],
      addRecentPost: mockAddRecentPost,
      clearRecentPosts: vi.fn()
    })
  })

  it('records the post once on mount, not again on re-render', () => {
    const {rerender} = render(<RecordRecentPost post={mockPost} />)

    expect(mockAddRecentPost).toHaveBeenCalledTimes(1)
    expect(mockAddRecentPost).toHaveBeenCalledWith(mockPost)

    rerender(<RecordRecentPost post={mockPost} />)

    expect(mockAddRecentPost).toHaveBeenCalledTimes(1)
  })

  it('does not refire when addRecentPost gets a new reference on re-render', () => {
    // Mirrors production: calling addRecentPost updates the underlying
    // useRecentPosts state, which re-renders this component and hands back
    // a brand-new addRecentPost/post closure. The effect must key off
    // post.id alone, or this reference churn refires it in a loop.
    const secondAddRecentPost = vi.fn()
    const {rerender} = render(<RecordRecentPost post={mockPost} />)

    expect(mockAddRecentPost).toHaveBeenCalledTimes(1)

    mockUseRecentPosts.mockReturnValue({
      recentPosts: [],
      addRecentPost: secondAddRecentPost,
      clearRecentPosts: vi.fn()
    })
    rerender(<RecordRecentPost post={{...mockPost}} />)

    expect(mockAddRecentPost).toHaveBeenCalledTimes(1)
    expect(secondAddRecentPost).not.toHaveBeenCalled()
  })

  it('renders nothing', () => {
    render(
      <div data-testid="wrapper">
        <RecordRecentPost post={mockPost} />
      </div>
    )

    expect(screen.getByTestId('wrapper')).toBeEmptyDOMElement()
  })
})

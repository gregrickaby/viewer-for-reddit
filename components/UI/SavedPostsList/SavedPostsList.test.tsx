import type {RedditPost} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {SavedPostsList} from './SavedPostsList'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  fetchSavedPosts: vi.fn(async () => ({
    posts: [],
    after: null
  }))
}))

const mockPosts: RedditPost[] = [
  {
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
  },
  {
    id: 'saved2',
    name: 't3_saved2',
    title: 'Second saved post',
    author: 'anotheauthor',
    subreddit: 'programming',
    subreddit_name_prefixed: 'r/programming',
    created_utc: 1234567800,
    score: 250,
    ups: 280,
    downs: 30,
    num_comments: 75,
    permalink: '/r/programming/comments/saved2/second_saved_post/',
    url: 'https://example.com/article',
    selftext: '',
    stickied: false,
    over_18: false,
    saved: true,
    thumbnail: '',
    is_video: false
  }
]

describe('SavedPostsList', () => {
  it('renders initial saved posts', () => {
    render(
      <SavedPostsList
        initialPosts={mockPosts}
        username="testuser"
        initialAfter={null}
      />
    )

    expect(screen.getByText('First saved post')).toBeInTheDocument()
    expect(screen.getByText('Second saved post')).toBeInTheDocument()
  })

  it('handles empty saved posts', () => {
    render(
      <SavedPostsList
        initialPosts={[]}
        username="testuser"
        initialAfter={null}
      />
    )

    // Should not show any posts
    expect(screen.queryByText('First saved post')).not.toBeInTheDocument()
  })

  it('shows "No more saved posts" when there are no more posts', () => {
    render(
      <SavedPostsList
        initialPosts={mockPosts}
        username="testuser"
        initialAfter={null}
      />
    )

    expect(screen.getByText('No more saved posts')).toBeInTheDocument()
  })

  it('does not show "No more saved posts" when there are more posts', () => {
    render(
      <SavedPostsList
        initialPosts={mockPosts}
        username="testuser"
        initialAfter="t3_cursor"
      />
    )

    expect(screen.queryByText('No more saved posts')).not.toBeInTheDocument()
  })
})

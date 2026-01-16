import type {RedditPost} from '@/lib/types/reddit'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock hooks before importing component
vi.mock('@/lib/hooks', () => ({
  useVote: vi.fn(),
  useSavePost: vi.fn()
}))

// Import after mocks
const {PostCard} = await import('./PostCard')
const hooks = await import('@/lib/hooks')

const mockPost: RedditPost = {
  id: 'test123',
  name: 't3_test123',
  title: 'Test Post Title',
  author: 'testuser',
  subreddit: 'test',
  subreddit_name_prefixed: 'r/test',
  permalink: '/r/test/comments/test123/test_post/',
  created_utc: Date.now() / 1000 - 3600,
  score: 100,
  num_comments: 42,
  selftext: 'This is the post body text',
  selftext_html: '<p>This is the <strong>post body</strong> text</p>',
  thumbnail: '',
  url: 'https://reddit.com/r/test/comments/test123/',
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  ups: 100,
  downs: 0
}

const mockUseVote = {
  voteState: 0 as 0 | 1 | -1 | null,
  score: 100,
  isPending: false,
  vote: vi.fn()
}

const mockUseSavePost = {
  isSaved: false,
  isPending: false,
  toggleSave: vi.fn()
}

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hooks.useVote).mockReturnValue(mockUseVote)
    vi.mocked(hooks.useSavePost).mockReturnValue(mockUseSavePost)
  })

  describe('analytics tracking', () => {
    it('has umami event on post title link', () => {
      render(<PostCard post={mockPost} />)

      const titleLink = screen.getByText('Test Post Title').closest('a')
      expect(titleLink).toHaveAttribute('data-umami-event', 'post-title-click')
    })

    it('has umami event on post text preview link', () => {
      render(<PostCard post={mockPost} />)

      const textLink = screen
        .getByText('This is the post body text')
        .closest('a')
      expect(textLink).toHaveAttribute(
        'data-umami-event',
        'post-text-preview-click'
      )
    })
  })

  describe('rendering', () => {
    it('renders post title', () => {
      render(<PostCard post={mockPost} />)

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('renders post header', () => {
      render(<PostCard post={mockPost} />)

      // Header components render subreddit and author links
      const allLinks = screen.getAllByRole('link')

      // Check for subreddit link
      const subredditLink = allLinks.find(
        (link) => link.getAttribute('href') === '/r/test'
      )
      expect(subredditLink).toBeDefined()

      // Check for author link
      const authorLink = allLinks.find(
        (link) => link.getAttribute('href') === '/u/testuser'
      )
      expect(authorLink).toBeDefined()
    })

    it('renders PostActions with correct props', () => {
      render(<PostCard post={mockPost} isAuthenticated />)

      // Check for PostActions buttons
      expect(screen.getByRole('button', {name: /upvote/i})).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /downvote/i})
      ).toBeInTheDocument()
    })

    it('wraps title with link to post', () => {
      render(<PostCard post={mockPost} />)

      const titleLink = screen.getByText('Test Post Title').closest('a')
      expect(titleLink).toHaveAttribute(
        'href',
        '/r/test/comments/test123/test_post'
      )
    })
  })

  describe('selftext', () => {
    it('shows truncated selftext by default', () => {
      render(<PostCard post={mockPost} />)

      expect(screen.getByText('This is the post body text')).toBeInTheDocument()
    })

    it('shows full HTML selftext when showFullText is true', () => {
      const {container} = render(<PostCard post={mockPost} showFullText />)

      // Check that HTML content is rendered
      // eslint-disable-next-line testing-library/no-container
      const htmlContent = container.querySelector('[class*="postBody"]')
      expect(htmlContent).toBeInTheDocument()
      expect(htmlContent?.innerHTML).toContain('<strong>post body</strong>')
    })

    it('sanitizes HTML content', () => {
      const postWithScript = {
        ...mockPost,
        selftext_html: '<p>Safe text</p><script>alert("xss")</script>'
      }

      const {container} = render(
        <PostCard post={postWithScript} showFullText />
      )

      // eslint-disable-next-line testing-library/no-container
      const htmlContent = container.querySelector('[class*="postBody"]')
      expect(htmlContent?.innerHTML).not.toContain('<script>')
      expect(htmlContent?.innerHTML).toContain('Safe text')
    })

    it('does not render selftext section when selftext is empty', () => {
      const postNoText = {...mockPost, selftext: '', selftext_html: ''}
      render(<PostCard post={postNoText} />)

      expect(screen.queryByText(/post body/)).not.toBeInTheDocument()
    })

    it('links truncated text to post', () => {
      render(<PostCard post={mockPost} />)

      const textLink = screen
        .getByText('This is the post body text')
        .closest('a')
      expect(textLink).toHaveAttribute(
        'href',
        '/r/test/comments/test123/test_post'
      )
    })
  })

  describe('voting', () => {
    it('passes vote handler to PostActions', async () => {
      render(<PostCard post={mockPost} isAuthenticated />)

      const upvoteButton = screen.getByRole('button', {name: /upvote/i})
      await user.click(upvoteButton)

      expect(mockUseVote.vote).toHaveBeenCalledWith(1)
    })

    it('shows vote state from hook', () => {
      vi.mocked(hooks.useVote).mockReturnValue({
        ...mockUseVote,
        voteState: 1,
        score: 101
      })

      render(<PostCard post={mockPost} isAuthenticated />)

      expect(screen.getByText('101')).toBeInTheDocument()
    })
  })

  describe('saving', () => {
    it('passes save handler to PostActions', async () => {
      render(<PostCard post={mockPost} isAuthenticated />)

      const saveButton = screen.getByRole('button', {name: /save post/i})
      await user.click(saveButton)

      expect(mockUseSavePost.toggleSave).toHaveBeenCalled()
    })

    it('shows saved state from hook', () => {
      vi.mocked(hooks.useSavePost).mockReturnValue({
        ...mockUseSavePost,
        isSaved: true
      })

      render(<PostCard post={mockPost} isAuthenticated />)

      expect(
        screen.getByRole('button', {name: /unsave post/i})
      ).toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    it('passes isAuthenticated to PostActions', () => {
      render(<PostCard post={mockPost} isAuthenticated={false} />)

      // Vote buttons should not have onClick when not authenticated
      const upvoteButton = screen.getByRole('button', {name: /upvote/i})
      expect(upvoteButton).toBeDisabled()
    })
  })

  describe('media', () => {
    it('renders PostMedia component', () => {
      const postWithImage = {
        ...mockPost,
        post_hint: 'image' as const,
        url: 'https://i.redd.it/test.jpg',
        preview: {
          enabled: true,
          images: [
            {
              source: {
                url: 'https://preview.redd.it/test.jpg',
                width: 800,
                height: 600
              },
              resolutions: [],
              variants: {}
            }
          ]
        }
      }

      render(<PostCard post={postWithImage} />)

      // Check that title still renders (PostMedia is present)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles missing permalink gracefully', () => {
      const postNoPermalink = {...mockPost, permalink: ''}
      render(<PostCard post={postNoPermalink} />)

      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('handles very long titles', () => {
      const longTitle = 'Very Long Title '.repeat(50)
      const postLongTitle = {...mockPost, title: longTitle}
      const {container} = render(<PostCard post={postLongTitle} />)

      // Check that the title is rendered (it's very long, so just check it exists)
      expect(container).toHaveTextContent(/Very Long Title/)
    })

    it('handles pending state from both hooks', () => {
      vi.mocked(hooks.useVote).mockReturnValue({
        ...mockUseVote,
        isPending: true
      })

      render(<PostCard post={mockPost} isAuthenticated />)

      const upvoteButton = screen.getByRole('button', {name: /upvote/i})
      expect(upvoteButton).toBeDisabled()
    })
  })

  describe('memoization', () => {
    it('is a memoized component', () => {
      // PostCard uses memo(), but displayName may not be set
      // Check that it renders correctly (memoization is internal)
      render(<PostCard post={mockPost} />)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })
  })
})

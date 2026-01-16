import {RedditPost} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {PostHeader} from './PostHeader'

describe('PostHeader', () => {
  const mockPost: RedditPost = {
    id: 'test123',
    name: 't3_test123',
    title: 'Test Post',
    author: 'testuser',
    subreddit: 'test',
    subreddit_name_prefixed: 'r/test',
    created_utc: Date.now() / 1000 - 3600, // 1 hour ago
    score: 42,
    num_comments: 10,
    over_18: false,
    permalink: '/r/test/comments/test123/test_post',
    url: 'https://reddit.com/r/test/comments/test123',
    thumbnail: '',
    is_video: false,
    stickied: false,
    ups: 42,
    downs: 0
  }

  describe('rendering', () => {
    it('renders subreddit badge', () => {
      render(<PostHeader post={mockPost} />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
    })

    it('renders subreddit badge as link', () => {
      render(<PostHeader post={mockPost} />)

      const badge = screen.getByText('r/test').closest('a')
      expect(badge).toHaveAttribute('href', '/r/test')
    })

    it('renders author name', () => {
      render(<PostHeader post={mockPost} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
    })

    it('renders author as link', () => {
      render(<PostHeader post={mockPost} />)

      const authorLink = screen.getByText('u/testuser')
      expect(authorLink).toHaveAttribute('href', '/u/testuser')
    })

    it('renders time ago', () => {
      const {container} = render(<PostHeader post={mockPost} />)

      // Text is split across elements with bullet, check container
      expect(container).toHaveTextContent(/h ago/)
    })

    it('renders posted by text', () => {
      render(<PostHeader post={mockPost} />)

      expect(screen.getByText(/Posted by/)).toBeInTheDocument()
    })
  })

  describe('NSFW badge', () => {
    it('shows NSFW badge when over_18 is true', () => {
      const nsfwPost = {...mockPost, over_18: true}
      render(<PostHeader post={nsfwPost} />)

      expect(screen.getByText('NSFW')).toBeInTheDocument()
    })

    it('does not show NSFW badge when over_18 is false', () => {
      render(<PostHeader post={mockPost} />)

      expect(screen.queryByText('NSFW')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('renders deleted author as plain text, not link', () => {
      const deletedPost = {...mockPost, author: '[deleted]'}
      render(<PostHeader post={deletedPost} />)

      const authorText = screen.getByText('u/[deleted]')
      expect(authorText).toBeInTheDocument()
      // Should not be wrapped in anchor
      expect(authorText.tagName).toBe('SPAN')
    })

    it('renders removed author as plain text, not link', () => {
      const removedPost = {...mockPost, author: '[removed]'}
      render(<PostHeader post={removedPost} />)

      const authorText = screen.getByText('u/[removed]')
      expect(authorText).toBeInTheDocument()
      // Should not be wrapped in anchor
      expect(authorText.tagName).toBe('SPAN')
    })

    it('renders normal author as link', () => {
      render(<PostHeader post={mockPost} />)

      const authorLink = screen.getByText('u/testuser')
      expect(authorLink).toHaveAttribute('href', '/u/testuser')
      expect(authorLink.tagName).toBe('A')
    })

    it('handles very long subreddit names', () => {
      const longSubreddit = 'verylongsubredditname'.repeat(3)
      const longPost = {
        ...mockPost,
        subreddit: longSubreddit,
        subreddit_name_prefixed: `r/${longSubreddit}`
      }
      render(<PostHeader post={longPost} />)

      expect(screen.getByText(`r/${longSubreddit}`)).toBeInTheDocument()
    })

    it('handles very long author names', () => {
      const longAuthor = 'verylongusername'.repeat(3)
      const longPost = {...mockPost, author: longAuthor}
      render(<PostHeader post={longPost} />)

      expect(screen.getByText(`u/${longAuthor}`)).toBeInTheDocument()
    })

    it('handles recent timestamps', () => {
      const recentPost = {...mockPost, created_utc: Date.now() / 1000 - 30}
      render(<PostHeader post={recentPost} />)

      // Format is "30s ago" (seconds)
      expect(screen.getByText(/s ago/)).toBeInTheDocument()
    })

    it('handles old timestamps', () => {
      const oldPost = {
        ...mockPost,
        created_utc: Date.now() / 1000 - 31536000
      } // 1 year ago
      render(<PostHeader post={oldPost} />)

      // Format is "365d ago" (days)
      expect(screen.getByText(/d ago/)).toBeInTheDocument()
    })

    it('handles special characters in subreddit name', () => {
      const specialPost = {
        ...mockPost,
        subreddit: 'test_sub-name',
        subreddit_name_prefixed: 'r/test_sub-name'
      }
      render(<PostHeader post={specialPost} />)

      expect(screen.getByText('r/test_sub-name')).toBeInTheDocument()
    })

    it('handles special characters in author name', () => {
      const specialPost = {...mockPost, author: 'user_name-123'}
      render(<PostHeader post={specialPost} />)

      expect(screen.getByText('u/user_name-123')).toBeInTheDocument()
    })
  })
})

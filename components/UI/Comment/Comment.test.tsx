import {votePost} from '@/lib/actions/reddit'
import {RedditComment} from '@/lib/types/reddit'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Comment} from './Comment'

vi.mock('@/lib/actions/reddit', () => ({
  votePost: vi.fn(async () => ({success: true}))
}))

const mockVotePost = vi.mocked(votePost)

describe('Comment', () => {
  const mockComment: RedditComment = {
    id: 'test123',
    name: 't1_test123',
    author: 'testuser',
    body: 'This is a test comment',
    body_html: '<div>This is a test comment</div>',
    score: 42,
    created_utc: Date.now() / 1000 - 3600, // 1 hour ago
    likes: null,
    distinguished: undefined,
    depth: 0,
    parent_id: 't3_post123',
    permalink: '/r/test/comments/post123/_/test123',
    stickied: false,
    score_hidden: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders comment with author username', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
    })

    it('renders comment body from body_html', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    })

    it('renders comment score', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders time ago', () => {
      const {container} = render(<Comment comment={mockComment} />)

      // Text is split across elements with bullet, check container
      expect(container).toHaveTextContent(/h ago/)
    })

    it('renders vote buttons when authenticated', () => {
      render(<Comment comment={mockComment} isAuthenticated />)

      expect(
        screen.getByRole('button', {name: /Upvote comment/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /Downvote comment/i})
      ).toBeInTheDocument()
    })
  })

  describe('distinguished comments', () => {
    it('renders moderator badge for moderator comments', () => {
      const modComment = {...mockComment, distinguished: 'moderator'}
      render(<Comment comment={modComment} />)

      expect(screen.getByText('moderator')).toBeInTheDocument()
    })

    it('renders admin badge for admin comments', () => {
      const adminComment = {...mockComment, distinguished: 'admin'}
      render(<Comment comment={adminComment} />)

      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('does not render badge for normal comments', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.queryByText('moderator')).not.toBeInTheDocument()
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
    })
  })

  describe('voting', () => {
    it('calls vote function when upvote button is clicked', async () => {
      render(<Comment comment={mockComment} isAuthenticated />)

      const upvoteButton = screen.getByRole('button', {name: /Upvote comment/i})
      await user.click(upvoteButton)

      expect(mockVotePost).toHaveBeenCalledWith('t1_test123', 1)
    })

    it('calls vote function when downvote button is clicked', async () => {
      render(<Comment comment={mockComment} isAuthenticated />)

      const downvoteButton = screen.getByRole('button', {
        name: /Downvote comment/i
      })
      await user.click(downvoteButton)

      expect(mockVotePost).toHaveBeenCalledWith('t1_test123', -1)
    })

    it('does not call vote when not authenticated', async () => {
      render(<Comment comment={mockComment} isAuthenticated={false} />)

      const upvoteButton = screen.getByRole('button', {name: /Upvote comment/i})
      await user.click(upvoteButton)

      expect(mockVotePost).not.toHaveBeenCalled()
    })

    it('disables vote buttons when not authenticated', () => {
      render(<Comment comment={mockComment} isAuthenticated={false} />)

      const upvoteButton = screen.getByRole('button', {name: /Upvote comment/i})
      const downvoteButton = screen.getByRole('button', {
        name: /Downvote comment/i
      })

      expect(upvoteButton).toBeDisabled()
      expect(downvoteButton).toBeDisabled()
    })
  })

  describe('HTML sanitization', () => {
    it('sanitizes HTML entities in body_html', () => {
      const commentWithEntities = {
        ...mockComment,
        body_html: '&lt;p&gt;Hello&lt;/p&gt;'
      }
      render(<Comment comment={commentWithEntities} />)

      // Should decode entities
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('removes dangerous HTML tags', () => {
      const dangerousComment = {
        ...mockComment,
        body_html: '<script>alert("xss")</script><p>Safe content</p>'
      }
      const {container} = render(<Comment comment={dangerousComment} />)

      // Script tag should be removed by DOMPurify
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).not.toBeInTheDocument()
    })

    it('falls back to body when body_html is not provided', () => {
      const commentWithoutHtml = {
        ...mockComment,
        body_html: '',
        body: 'Plain text comment'
      }
      render(<Comment comment={commentWithoutHtml} />)

      expect(screen.getByText('Plain text comment')).toBeInTheDocument()
    })
  })

  describe('nested replies', () => {
    it('renders nested comment replies', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'replyuser',
                  body: 'This is a reply',
                  body_html: '<div>This is a reply</div>',
                  score: 10,
                  created_utc: Date.now() / 1000 - 1800,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithReplies as any} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
      expect(screen.getByText('u/replyuser')).toBeInTheDocument()
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('renders multiple nested replies', () => {
      const commentWithMultipleReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'First reply',
                  body_html: '<div>First reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              },
              {
                kind: 't1',
                data: {
                  id: 'reply2',
                  name: 't1_reply2',
                  author: 'user2',
                  body: 'Second reply',
                  body_html: '<div>Second reply</div>',
                  score: 3,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithMultipleReplies as any} />)

      expect(screen.getByText('u/user1')).toBeInTheDocument()
      expect(screen.getByText('u/user2')).toBeInTheDocument()
      expect(screen.getByText('First reply')).toBeInTheDocument()
      expect(screen.getByText('Second reply')).toBeInTheDocument()
    })

    it('filters out non-comment children from replies', () => {
      const commentWithMixedReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'Valid reply',
                  body_html: '<div>Valid reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              },
              {kind: 'more', data: {}} // Should be filtered out
            ]
          }
        }
      }

      render(<Comment comment={commentWithMixedReplies as any} />)

      expect(screen.getByText('Valid reply')).toBeInTheDocument()
      // Only one user (plus the parent comment's user)
      const users = screen.getAllByText(/u\//i)
      expect(users).toHaveLength(2) // testuser + user1
    })
  })

  describe('edge cases', () => {
    it('handles comment with zero score', () => {
      const zeroScoreComment = {...mockComment, score: 0}
      render(<Comment comment={zeroScoreComment} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles comment with negative score', () => {
      const negativeScoreComment = {...mockComment, score: -5}
      render(<Comment comment={negativeScoreComment} />)

      expect(screen.getByText('-5')).toBeInTheDocument()
    })

    it('handles comment with deleted author', () => {
      const deletedComment = {...mockComment, author: '[deleted]'}
      render(<Comment comment={deletedComment} />)

      expect(screen.getByText('u/[deleted]')).toBeInTheDocument()
    })

    it('handles comment with no replies', () => {
      const noRepliesComment = {...mockComment, replies: undefined}
      render(<Comment comment={noRepliesComment} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
      // Should only have one username (the parent)
      expect(screen.getAllByText(/u\//i)).toHaveLength(1)
    })

    it('handles very long comment body', () => {
      const longComment = {
        ...mockComment,
        body: 'A'.repeat(10000),
        body_html: `<div>${'A'.repeat(10000)}</div>`
      }
      render(<Comment comment={longComment} />)

      expect(screen.getByText('A'.repeat(10000))).toBeInTheDocument()
    })
  })
})

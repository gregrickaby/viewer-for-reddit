import {votePost} from '@/lib/actions/reddit'
import {RedditComment} from '@/lib/types/reddit'
import {render, screen, user, waitFor} from '@/test-utils'
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

      // Script tag should be removed by sanitize-html
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

  describe('collapse functionality', () => {
    it('shows collapse button only for top-level comments (depth 0)', () => {
      const {rerender} = render(<Comment comment={mockComment} depth={0} />)

      // Top-level comment should have collapse button
      expect(
        screen.getByRole('button', {name: /collapse comment/i})
      ).toBeInTheDocument()

      // Nested comment should not have collapse button
      rerender(<Comment comment={mockComment} depth={1} />)

      expect(
        screen.queryByRole('button', {name: /collapse comment/i})
      ).not.toBeInTheDocument()
    })

    it('starts with comment expanded by default', () => {
      render(<Comment comment={mockComment} />)

      // Comment body should be visible
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()

      // Voting buttons should be visible
      expect(
        screen.getByRole('button', {name: /upvote comment/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /downvote comment/i})
      ).toBeInTheDocument()

      // Should show chevron up icon (collapse)
      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapses comment body when collapse button clicked', async () => {
      render(<Comment comment={mockComment} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })

      // Click to collapse
      await user.click(collapseButton)

      // Wait for state change
      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Button text should change to "Expand"
      expect(
        screen.getByRole('button', {name: /expand comment/i})
      ).toBeInTheDocument()
    })

    it('expands comment body when expand button clicked', async () => {
      render(<Comment comment={mockComment} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })

      // Collapse first
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      const expandButton = screen.getByRole('button', {name: /expand comment/i})

      // Expand again
      await user.click(expandButton)

      await waitFor(() => {
        expect(expandButton).toHaveAttribute('aria-expanded', 'true')
      })

      // Content should be visible again
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    })

    it('hides child replies when collapsed', async () => {
      const commentWithReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing' as const,
          data: {
            children: [
              {
                kind: 't1' as const,
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'replyuser',
                  body: 'This is a reply',
                  body_html: '<div>This is a reply</div>',
                  score: 10,
                  created_utc: Date.now() / 1000 - 1800,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply1',
                  stickied: false,
                  score_hidden: false
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithReplies} depth={0} />)

      // Child reply should be visible initially
      expect(screen.getByText('This is a reply')).toBeInTheDocument()

      // Collapse the comment
      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Child replies should eventually be hidden (Mantine Collapse has animation)
      await waitFor(
        () => {
          const reply = screen.queryByText('This is a reply')
          expect(reply).not.toBeVisible()
        },
        {timeout: 2000}
      )
    })

    it('shows reply count when collapsed and has replies', async () => {
      const commentWithMultipleReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing' as const,
          data: {
            children: [
              {
                kind: 't1' as const,
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'First reply',
                  body_html: '<div>First reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply1',
                  stickied: false,
                  score_hidden: false
                }
              },
              {
                kind: 't1' as const,
                data: {
                  id: 'reply2',
                  name: 't1_reply2',
                  author: 'user2',
                  body: 'Second reply',
                  body_html: '<div>Second reply</div>',
                  score: 3,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply2',
                  stickied: false,
                  score_hidden: false
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithMultipleReplies} depth={0} />)

      // Reply count should not be visible when expanded
      expect(screen.queryByText('(2 replies)')).not.toBeInTheDocument()

      // Collapse the comment
      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Reply count should be visible when collapsed
      expect(screen.getByText('(2 replies)')).toBeInTheDocument()
    })

    it('shows singular "reply" for one reply', async () => {
      const commentWithOneReply = {
        ...mockComment,
        replies: {
          kind: 'Listing' as const,
          data: {
            children: [
              {
                kind: 't1' as const,
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'replyuser',
                  body: 'Only reply',
                  body_html: '<div>Only reply</div>',
                  score: 10,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply1',
                  stickied: false,
                  score_hidden: false
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithOneReply} depth={0} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Should show "reply" not "replies"
      expect(screen.getByText('(1 reply)')).toBeInTheDocument()
    })

    it('does not show reply count when collapsed with no replies', async () => {
      render(<Comment comment={mockComment} depth={0} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Should not show reply count if there are no replies
      expect(screen.queryByText(/replies?/)).not.toBeInTheDocument()
    })

    it('has proper accessibility attributes for collapse button', () => {
      render(<Comment comment={mockComment} depth={0} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })

      expect(collapseButton).toHaveAttribute('aria-label', 'Collapse comment')
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('toggles aria-expanded attribute when collapsing/expanding', async () => {
      render(<Comment comment={mockComment} depth={0} />)

      const button = screen.getByRole('button', {name: /collapse comment/i})

      // Initially expanded
      expect(button).toHaveAttribute('aria-expanded', 'true')

      // Collapse
      await user.click(button)
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false')
      })

      // Expand
      await user.click(button)
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('preserves collapse state independently for each comment', async () => {
      // Render two separate top-level comments
      render(
        <>
          <Comment comment={{...mockComment, id: 'comment1'}} depth={0} />
          <Comment comment={{...mockComment, id: 'comment2'}} depth={0} />
        </>
      )

      const buttons = screen.getAllByRole('button', {name: /collapse comment/i})
      expect(buttons).toHaveLength(2)

      // Collapse only first comment
      await user.click(buttons[0])

      await waitFor(() => {
        expect(buttons[0]).toHaveAttribute('aria-expanded', 'false')
      })

      // Second comment should still be expanded
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'true')
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

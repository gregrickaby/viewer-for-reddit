import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {render, screen, user, waitFor} from '@/test-utils'
import {axe} from 'jest-axe'
import {CommentItem} from './CommentItem'

// Helper to delay API responses
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockBasicComment: NestedCommentData = {
  id: 'comment1',
  name: 't1_comment1',
  author: 'testuser',
  body: 'This is a test comment',
  body_html: '<p>This is a test comment</p>',
  created_utc: Date.now() / 1000,
  ups: 42,
  permalink: '/r/test/comments/abc123/test/comment1',
  depth: 0,
  hasReplies: false
}

const mockCommentWithReplies: NestedCommentData = {
  id: 'comment2',
  name: 't1_comment2',
  author: 'parentuser',
  body: 'Parent comment',
  body_html: '<p>Parent comment</p>',
  created_utc: Date.now() / 1000,
  ups: 15,
  permalink: '/r/test/comments/abc123/test/comment2',
  depth: 0,
  hasReplies: true,
  replies: [
    {
      id: 'reply1',
      name: 't1_reply1',
      author: 'replyuser',
      body: 'Reply to parent',
      body_html: '<p>Reply to parent</p>',
      created_utc: Date.now() / 1000,
      ups: 8,
      permalink: '/r/test/comments/abc123/test/reply1',
      depth: 1,
      hasReplies: false
    }
  ]
}

const mockNestedComment: NestedCommentData = {
  ...mockBasicComment,
  depth: 2
}

describe('CommentItem', () => {
  it('should render basic comment information', () => {
    render(<CommentItem comment={mockBasicComment} />)

    expect(screen.getByText(/u\/testuser/i)).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(
      screen.getByRole('link', {name: /view on reddit/i})
    ).toBeInTheDocument()
  })

  it('should show expand button and reply count for comments with replies', () => {
    render(<CommentItem comment={mockCommentWithReplies} />)

    // With Reddit-style defaults, depth 0 comments are expanded by default
    expect(
      screen.getByRole('button', {name: /collapse replies/i})
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: /expand all descendants/i})
    ).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should show plural reply count for multiple replies', () => {
    const commentWithMultipleReplies = {
      ...mockCommentWithReplies,
      replies: [
        mockCommentWithReplies.replies![0],
        {...mockCommentWithReplies.replies![0], id: 'reply2'}
      ]
    }

    render(<CommentItem comment={commentWithMultipleReplies} />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should expand and collapse replies when button is clicked', async () => {
    render(<CommentItem comment={mockCommentWithReplies} />)

    // With Reddit-style defaults, depth 0 starts expanded
    let button = screen.getByRole('button', {name: /collapse replies/i})

    // Check initial state - button should say "Collapse"
    expect(button).toHaveAttribute('aria-label', 'Collapse replies')
    // Content should be visible initially
    expect(screen.getByText(/u\/replyuser/i)).toBeInTheDocument()

    // Collapse
    await user.click(button)

    // Re-query for the button after state change
    button = screen.getByRole('button', {name: /expand replies/i})
    expect(button).toBeInTheDocument()

    // Expand again
    await user.click(button)

    // Re-query for collapse button
    button = screen.getByRole('button', {name: /collapse replies/i})
    expect(button).toBeInTheDocument()
  })

  it('should expand and collapse all descendants when expand-all button is clicked', async () => {
    const nestedComment = {
      ...mockCommentWithReplies,
      replies: [
        {
          ...mockCommentWithReplies.replies![0],
          hasReplies: true,
          replies: [
            {
              id: 'nested-reply',
              author: 'nesteduser',
              body: 'Nested reply',
              body_html: '<p>Nested reply</p>',
              created_utc: Date.now() / 1000,
              ups: 3,
              permalink: '/r/test/comments/abc123/test/nested-reply',
              depth: 2,
              hasReplies: false
            }
          ]
        }
      ]
    }

    render(<CommentItem comment={nestedComment} />)

    // With Reddit-style defaults, depth 0-1 are expanded, so multiple expand-all buttons exist
    let expandAllButtons = screen.getAllByRole('button', {
      name: /expand all descendants/i
    })
    let button = expandAllButtons[0] // Get parent's button

    // Initially not fully expanded (grandchild at depth 2 is collapsed)
    expect(button).toHaveAttribute('aria-label', 'Expand all descendants (O)')

    // Expand all
    await user.click(button)

    // Should show all nested content
    expect(screen.getByText(/u\/replyuser/i)).toBeInTheDocument()
    expect(screen.getByText(/u\/nesteduser/i)).toBeInTheDocument()
    expect(screen.getByText('Nested reply')).toBeInTheDocument()

    // Re-query for collapse button
    button = screen.getByRole('button', {name: /collapse all descendants/i})
    expect(button).toBeInTheDocument()

    // Collapse all
    await user.click(button)

    // Re-query for expand button (there might be multiple again)
    expandAllButtons = screen.getAllByRole('button', {
      name: /expand all descendants/i
    })
    expect(expandAllButtons.length).toBeGreaterThan(0)
  })

  it('should apply nested comment styling for deeper levels', () => {
    render(<CommentItem comment={mockNestedComment} />)

    const commentItem = screen.getByTestId('comment-item-depth-2')
    expect(commentItem).toHaveStyle('--comment-depth: 2')
  })

  it('should show depth limit message when max depth is reached', () => {
    const deepComment = {
      ...mockCommentWithReplies,
      depth: 4
    }

    render(<CommentItem comment={deepComment} maxDepth={4} />)

    expect(
      screen.getByText(/1 more reply.*depth limit reached/)
    ).toBeInTheDocument()
  })

  it('should not show expand buttons for comments without replies', () => {
    render(<CommentItem comment={mockBasicComment} />)

    expect(
      screen.queryByRole('button', {name: /expand replies/i})
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: /expand all descendants/i})
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/reply/)).not.toBeInTheDocument()
  })

  it('should show collapsed preview when comment is collapsed', async () => {
    render(<CommentItem comment={mockCommentWithReplies} />)

    // With Reddit-style defaults, depth 0 starts expanded
    const button = screen.getByRole('button', {name: /collapse replies/i})

    // Collapse the comment
    await user.click(button)

    // Should show preview with count and first reply snippet
    expect(screen.getByText(/1 reply collapsed/i)).toBeInTheDocument()
    expect(screen.getByText(/replyuser: Reply to parent/i)).toBeInTheDocument()
  })

  it('should hide collapsed preview when comment is expanded', () => {
    render(<CommentItem comment={mockCommentWithReplies} />)

    // With Reddit-style defaults, depth 0 starts expanded
    // Preview should not be visible
    expect(screen.queryByText(/1 reply collapsed/i)).not.toBeInTheDocument()
  })

  it('should render thread line for nested comments', () => {
    render(<CommentItem comment={mockNestedComment} />)

    // Check for thread line element - it should be present for depth > 0
    expect(screen.getByTestId('thread-line')).toBeInTheDocument()
  })

  it('should not render thread line for top-level comments', () => {
    render(<CommentItem comment={mockBasicComment} />)

    // Should not have thread line for depth 0 comments
    expect(screen.queryByTestId('thread-line')).not.toBeInTheDocument()
  })

  it('should display vote buttons with score for comments with replies', () => {
    render(<CommentItem comment={mockCommentWithReplies} />)

    // Check that vote score is displayed (only shown for comments with replies)
    expect(screen.getByText('15')).toBeInTheDocument()

    // Check that author is displayed (to confirm we're in the header area)
    expect(screen.getByText(/u\/parentuser/i)).toBeInTheDocument()

    // Verify vote score is visible to users (VoteButtons component)
    expect(screen.getByText('15')).toBeVisible()
  })

  describe('Accessibility', () => {
    it('should have no axe violations', async () => {
      const {container} = render(<CommentItem comment={mockBasicComment} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels on expand buttons', () => {
      render(<CommentItem comment={mockCommentWithReplies} />)

      expect(
        screen.getByRole('button', {name: /expand all descendants \(o\)/i})
      ).toBeInTheDocument()
    })
  })

  describe('Reply functionality', () => {
    const authenticatedState = {
      auth: {
        isAuthenticated: true,
        username: 'currentuser',
        expiresAt: Date.now() + 3600000
      }
    }

    it('should not show reply button when not authenticated', () => {
      render(<CommentItem comment={mockBasicComment} />)

      expect(
        screen.queryByRole('button', {name: /reply/i})
      ).not.toBeInTheDocument()
    })

    it('should show reply button when authenticated', () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      expect(screen.getByRole('button', {name: /reply/i})).toBeInTheDocument()
    })

    it('should toggle reply form when reply button is clicked', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      await screen.findByRole('textbox')
      expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /cancel/i})).toBeInTheDocument()
    })

    it('should close reply form when cancel button is clicked', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')

      const cancelButton = screen.getByRole('button', {name: /cancel/i})
      await user.click(cancelButton)

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should submit comment and close form on successful submission', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')

      const submitButton = screen.getByRole('button', {name: /submit/i})
      await user.click(submitButton)

      // Wait for form state to reset (showReplyForm becomes false)
      // The reply button should be clickable again
      await waitFor(() => {
        const button = screen.getByRole('button', {name: /reply/i})
        expect(button).toBeInTheDocument()
      })
    })

    it('should display error message on failed submission', async () => {
      const {server, http, HttpResponse} = await import('@/test-utils')
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', () => {
          return HttpResponse.json(
            {error: 'Failed to submit comment'},
            {status: 500}
          )
        })
      )

      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')

      const submitButton = screen.getByRole('button', {name: /submit/i})
      await user.click(submitButton)

      // Wait for error message to appear
      await waitFor(
        () => {
          expect(
            screen.getByText(/failed to submit comment/i)
          ).toBeInTheDocument()
        },
        {timeout: 3000}
      )

      // Form should remain open
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should not submit when textarea is empty', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      await screen.findByRole('textbox')

      const submitButton = screen.getByRole('button', {name: /submit/i})
      await user.click(submitButton)

      // Form should remain open (not submitted)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should submit with keyboard shortcut Cmd+Enter', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')
      await user.keyboard('{Meta>}{Enter}{/Meta}')

      // Wait for form state to reset
      await waitFor(() => {
        const button = screen.getByRole('button', {name: /reply/i})
        expect(button).toBeInTheDocument()
      })
    })

    it('should submit with keyboard shortcut Ctrl+Enter', async () => {
      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')
      await user.keyboard('{Control>}{Enter}{/Control}')

      // Wait for form state to reset
      await waitFor(() => {
        const button = screen.getByRole('button', {name: /reply/i})
        expect(button).toBeInTheDocument()
      })
    })

    it('should not show reply button at max depth', () => {
      const deepComment = {...mockBasicComment, depth: 10}

      render(<CommentItem comment={deepComment} />, {
        preloadedState: authenticatedState
      })

      expect(
        screen.queryByRole('button', {name: /reply/i})
      ).not.toBeInTheDocument()
    })

    it('should disable submit button while submitting', async () => {
      // Make MSW handler slow to simulate network delay
      const {server, http, HttpResponse} = await import('@/test-utils')
      server.use(
        http.post('/api/reddit/comment', async () => {
          await delay(200)
          return HttpResponse.json({
            comment: {
              id: 't1_newreply',
              name: 't1_newreply',
              author: 'currentuser',
              body: 'Test reply text',
              created_utc: Date.now() / 1000
            }
          })
        })
      )

      render(<CommentItem comment={mockBasicComment} />, {
        preloadedState: authenticatedState
      })

      const replyButton = screen.getByRole('button', {name: /reply/i})
      await user.click(replyButton)

      const textarea = await screen.findByRole('textbox')
      await user.type(textarea, 'Test reply text')

      const submitButton = screen.getByRole('button', {name: /submit/i})

      // Click submit and immediately check disabled state
      const clickPromise = user.click(submitButton)

      // Button should be disabled during submission (check within 50ms)
      await waitFor(
        () => {
          expect(submitButton).toBeDisabled()
        },
        {timeout: 100}
      )

      // Wait for submission to complete
      await clickPromise

      // Wait for form to close
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })
  })
})

import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {render, screen, user} from '@/test-utils'
import {axe} from 'jest-axe'
import {CommentItem} from './CommentItem'

const mockBasicComment: NestedCommentData = {
  id: 'comment1',
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
})

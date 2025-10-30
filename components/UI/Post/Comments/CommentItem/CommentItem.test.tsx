import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'
import {axe, toHaveNoViolations} from 'jest-axe'
import {CommentExpansionProvider} from '../CommentExpansionContext/CommentExpansionContext'
import {CommentItem} from './CommentItem'

expect.extend(toHaveNoViolations)

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
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockBasicComment} />
      </CommentExpansionProvider>
    )

    expect(screen.getByText(/u\/testuser/i)).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(screen.getByText(/view.*reddit/i)).toBeInTheDocument()
  })

  it('should show expand button and reply count for comments with replies', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockCommentWithReplies} />
      </CommentExpansionProvider>
    )

    expect(
      screen.getByRole('button', {name: /expand replies/i})
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: /expand all descendants/i})
    ).toBeInTheDocument()
    expect(screen.getByText('1 reply')).toBeInTheDocument()
  })

  it('should show plural reply count for multiple replies', () => {
    const commentWithMultipleReplies = {
      ...mockCommentWithReplies,
      replies: [
        mockCommentWithReplies.replies![0],
        {...mockCommentWithReplies.replies![0], id: 'reply2'}
      ]
    }

    render(
      <CommentExpansionProvider>
        <CommentItem comment={commentWithMultipleReplies} />
      </CommentExpansionProvider>
    )

    expect(screen.getByText('2 replies')).toBeInTheDocument()
  })

  it('should expand and collapse replies when button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockCommentWithReplies} />
      </CommentExpansionProvider>
    )

    const expandButton = screen.getByRole('button', {name: /expand replies/i})

    // Check initial state - button should say "Expand"
    expect(expandButton).toHaveAttribute('aria-label', 'Expand replies')

    // Expand
    await user.click(expandButton)

    // After expansion, button should change to "Collapse"
    expect(
      screen.getByRole('button', {name: /collapse replies/i})
    ).toBeInTheDocument()
    // Content should be visible
    expect(screen.getByText(/u\/replyuser/i)).toBeInTheDocument()

    // Collapse - check that the button text changes back
    await user.click(expandButton)
    expect(
      screen.getByRole('button', {name: /expand replies/i})
    ).toBeInTheDocument()
  })

  it('should expand and collapse all descendants when expand-all button is clicked', async () => {
    const user = userEvent.setup()
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

    render(
      <CommentExpansionProvider>
        <CommentItem comment={nestedComment} />
      </CommentExpansionProvider>
    )

    const expandAllButton = screen.getByRole('button', {
      name: /expand all descendants/i
    })

    // Initially collapsed
    expect(expandAllButton).toHaveAttribute(
      'aria-label',
      'Expand all descendants (O)'
    )

    // Expand all
    await user.click(expandAllButton)

    // Should show all nested content
    expect(screen.getByText(/u\/replyuser/i)).toBeInTheDocument()
    expect(screen.getByText(/u\/nesteduser/i)).toBeInTheDocument()
    expect(screen.getByText('Nested reply')).toBeInTheDocument()

    // Button should change to collapse
    expect(
      screen.getByRole('button', {name: /collapse all descendants/i})
    ).toBeInTheDocument()

    // Collapse all
    await user.click(expandAllButton)

    // Button should change back
    expect(
      screen.getByRole('button', {name: /expand all descendants/i})
    ).toBeInTheDocument()
  })

  it('should apply nested comment styling for deeper levels', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockNestedComment} />
      </CommentExpansionProvider>
    )

    const commentItem = screen.getByTestId('comment-item-depth-2')
    expect(commentItem).toHaveStyle('--comment-depth: 2')
  })

  it('should show depth limit message when max depth is reached', () => {
    const deepComment = {
      ...mockCommentWithReplies,
      depth: 4
    }

    render(
      <CommentExpansionProvider>
        <CommentItem comment={deepComment} maxDepth={4} />
      </CommentExpansionProvider>
    )

    expect(
      screen.getByText(/1 more reply.*depth limit reached/)
    ).toBeInTheDocument()
  })

  it('should not show expand buttons for comments without replies', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockBasicComment} />
      </CommentExpansionProvider>
    )

    expect(
      screen.queryByRole('button', {name: /expand replies/i})
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: /expand all descendants/i})
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/reply/)).not.toBeInTheDocument()
  })

  it('should render thread line for nested comments', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockNestedComment} />
      </CommentExpansionProvider>
    )

    // Check for thread line element - it should be present for depth > 0
    expect(screen.getByTestId('thread-line')).toBeInTheDocument()
  })

  it('should not render thread line for top-level comments', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockBasicComment} />
      </CommentExpansionProvider>
    )

    // Should not have thread line for depth 0 comments
    expect(screen.queryByTestId('thread-line')).not.toBeInTheDocument()
  })

  it('should display vote buttons with score for comments with replies', () => {
    render(
      <CommentExpansionProvider>
        <CommentItem comment={mockCommentWithReplies} />
      </CommentExpansionProvider>
    )

    // Check that vote score is displayed (only shown for comments with replies)
    expect(screen.getByText('15')).toBeInTheDocument()

    // Check that author is displayed (to confirm we're in the header area)
    expect(screen.getByText(/u\/parentuser/i)).toBeInTheDocument()

    // Verify vote score is visible to users (VoteButtons component)
    expect(screen.getByText('15')).toBeVisible()
  })

  describe('Accessibility', () => {
    it('should have no axe violations', async () => {
      const {container} = render(
        <CommentExpansionProvider>
          <CommentItem comment={mockBasicComment} />
        </CommentExpansionProvider>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels on expand buttons', () => {
      render(
        <CommentExpansionProvider>
          <CommentItem comment={mockCommentWithReplies} />
        </CommentExpansionProvider>
      )

      expect(
        screen.getByRole('button', {name: /expand all descendants \(o\)/i})
      ).toBeInTheDocument()
    })
  })
})

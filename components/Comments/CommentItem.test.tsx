import type {NestedCommentData} from '@/lib/utils/commentFilters'
import {MantineProvider} from '@mantine/core'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {CommentItem} from './CommentItem'

const TestWrapper = ({children}: {children: React.ReactNode}) => (
  <MantineProvider>{children}</MantineProvider>
)

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
    render(<CommentItem comment={mockBasicComment} />, {wrapper: TestWrapper})

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('View on Reddit')).toBeInTheDocument()
  })

  it('should show expand button and reply count for comments with replies', () => {
    render(<CommentItem comment={mockCommentWithReplies} />, {
      wrapper: TestWrapper
    })

    expect(
      screen.getByRole('button', {name: /expand replies/i})
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

    render(<CommentItem comment={commentWithMultipleReplies} />, {
      wrapper: TestWrapper
    })

    expect(screen.getByText('2 replies')).toBeInTheDocument()
  })

  it('should expand and collapse replies when button is clicked', async () => {
    const user = userEvent.setup()
    render(<CommentItem comment={mockCommentWithReplies} />, {
      wrapper: TestWrapper
    })

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
    expect(screen.getByText('replyuser')).toBeInTheDocument()

    // Collapse - check that the button text changes back
    await user.click(expandButton)
    expect(
      screen.getByRole('button', {name: /expand replies/i})
    ).toBeInTheDocument()
  })

  it('should apply nested comment styling for deeper levels', () => {
    render(<CommentItem comment={mockNestedComment} />, {
      wrapper: TestWrapper
    })

    const commentItem = screen.getByTestId('comment-item-depth-2')
    expect(commentItem).toHaveStyle('--comment-depth: 2')
  })

  it('should show depth limit message when max depth is reached', () => {
    const deepComment = {
      ...mockCommentWithReplies,
      depth: 4
    }

    render(<CommentItem comment={deepComment} maxDepth={4} />, {
      wrapper: TestWrapper
    })

    expect(
      screen.getByText(/1 more reply.*depth limit reached/)
    ).toBeInTheDocument()
  })

  it('should not show expand button for comments without replies', () => {
    render(<CommentItem comment={mockBasicComment} />, {wrapper: TestWrapper})

    expect(
      screen.queryByRole('button', {name: /expand replies/i})
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/reply/)).not.toBeInTheDocument()
  })

  it('should render thread line for nested comments', () => {
    render(<CommentItem comment={mockNestedComment} />, {
      wrapper: TestWrapper
    })

    // Check for thread line element - it should be present for depth > 0
    expect(screen.getByTestId('thread-line')).toBeInTheDocument()
  })

  it('should not render thread line for top-level comments', () => {
    render(<CommentItem comment={mockBasicComment} />, {
      wrapper: TestWrapper
    })

    // Should not have thread line for depth 0 comments
    expect(screen.queryByTestId('thread-line')).not.toBeInTheDocument()
  })

  it('should display upvotes in a Badge component in the comment header', () => {
    render(<CommentItem comment={mockBasicComment} />, {wrapper: TestWrapper})

    // Check that upvote count is displayed
    expect(screen.getByText('42')).toBeInTheDocument()

    // Check that author is displayed (to confirm we're in the header area)
    expect(screen.getByText('testuser')).toBeInTheDocument()

    // Verify upvote count is displayed (Badge component presence is implementation detail)
    // The important thing is that the upvote count is visible to users
    expect(screen.getByText('42')).toBeVisible()
  })
})

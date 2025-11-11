import type {NestedCommentData} from '@/lib/utils/formatting/comments/commentFilters'
import {render, screen} from '@/test-utils'
import {CommentMetadata} from './CommentMetadata'

const mockComment: NestedCommentData = {
  id: 'comment1',
  name: 't1_comment1',
  author: 'testuser',
  body: 'Test comment',
  body_html: '<p>Test comment</p>',
  created_utc: Date.now() / 1000,
  ups: 42,
  permalink: '/r/test/comments/abc123/test/comment1',
  depth: 0,
  replies: [
    {
      id: 'reply1',
      author: 'replyuser',
      body: 'Reply',
      body_html: '<p>Reply</p>',
      created_utc: Date.now() / 1000,
      ups: 8,
      permalink: '/r/test/comments/abc123/test/reply1',
      depth: 1
    }
  ]
}

describe('CommentMetadata', () => {
  const defaultProps = {
    comment: mockComment,
    showReplies: true,
    hasReplies: true
  }

  it('should render vote buttons with score', () => {
    render(<CommentMetadata {...defaultProps} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render reply count when comment has replies', () => {
    render(<CommentMetadata {...defaultProps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should render external Reddit link', () => {
    render(<CommentMetadata {...defaultProps} />)

    const link = screen.getByRole('link', {name: /view on reddit/i})
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute(
      'href',
      'https://reddit.com/r/test/comments/abc123/test/comment1'
    )
  })

  it('should not render reply count when comment has no replies', () => {
    const commentWithoutReplies = {...mockComment, replies: undefined}
    render(
      <CommentMetadata
        {...defaultProps}
        comment={commentWithoutReplies}
        hasReplies={false}
      />
    )

    // Score should still be visible, but not reply count
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})

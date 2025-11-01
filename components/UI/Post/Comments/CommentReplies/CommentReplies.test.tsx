import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {render, screen} from '@/test-utils'
import {CommentReplies} from './CommentReplies'

/**
 * Mock parent comment with replies.
 */
const mockCommentWithReplies: NestedCommentData = {
  id: 'parent123',
  name: 't1_parent123',
  author: 'parentuser',
  body: 'Parent comment',
  body_html: '<p>Parent comment</p>',
  created_utc: 1609459200,
  score: 10,
  depth: 0,
  permalink: '/r/test/comments/test/test/parent123',
  replies: [
    {
      id: 'child123',
      name: 't1_child123',
      author: 'childuser',
      body: 'Child comment',
      body_html: '<p>Child comment</p>',
      created_utc: 1609459300,
      score: 5,
      depth: 1,
      permalink: '/r/test/comments/test/test/child123'
    }
  ]
}

const mockCommentWithoutReplies: NestedCommentData = {
  id: 'noreplies123',
  name: 't1_noreplies123',
  author: 'testuser',
  body: 'No replies comment',
  body_html: '<p>No replies comment</p>',
  created_utc: 1609459200,
  score: 10,
  depth: 0,
  permalink: '/r/test/comments/test/test/noreplies123'
}

describe('CommentReplies', () => {
  it('should render nothing when no replies', () => {
    render(
      <CommentReplies
        comment={mockCommentWithoutReplies}
        isExpanded={false}
        maxDepth={10}
      />
    )
    expect(screen.queryByText(/reply/i)).not.toBeInTheDocument()
  })

  it('should show collapsed preview when not expanded', () => {
    render(
      <CommentReplies
        comment={mockCommentWithReplies}
        isExpanded={false}
        maxDepth={10}
      />
    )
    expect(screen.getByText('1 reply collapsed')).toBeInTheDocument()
  })

  it('should show plural text for multiple replies', () => {
    const multipleReplies = {
      ...mockCommentWithReplies,
      replies: [
        mockCommentWithReplies.replies![0],
        {...mockCommentWithReplies.replies![0], id: 'child456'}
      ]
    }
    render(
      <CommentReplies
        comment={multipleReplies}
        isExpanded={false}
        maxDepth={10}
      />
    )
    expect(screen.getByText('2 replies collapsed')).toBeInTheDocument()
  })

  it('should show depth limit message when max depth reached', () => {
    const deepComment = {...mockCommentWithReplies, depth: 10}
    render(
      <CommentReplies comment={deepComment} isExpanded={false} maxDepth={10} />
    )
    expect(
      screen.getByText('1 more reply (depth limit reached)')
    ).toBeInTheDocument()
  })

  it('should show preview of first reply when collapsed', () => {
    render(
      <CommentReplies
        comment={mockCommentWithReplies}
        isExpanded={false}
        maxDepth={10}
      />
    )
    expect(screen.getByText(/childuser:/)).toBeInTheDocument()
  })

  it('should render nested CommentItems when expanded', () => {
    render(
      <CommentReplies
        comment={mockCommentWithReplies}
        isExpanded
        maxDepth={10}
      />
    )
    expect(screen.getByText('Child comment')).toBeInTheDocument()
  })

  it('should not show preview when expanded', () => {
    render(
      <CommentReplies
        comment={mockCommentWithReplies}
        isExpanded
        maxDepth={10}
      />
    )
    expect(screen.queryByText('1 reply collapsed')).not.toBeInTheDocument()
  })
})

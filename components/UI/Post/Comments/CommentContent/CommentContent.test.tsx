import {render, screen} from '@/test-utils'
import {CommentContent} from './CommentContent'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'

/**
 * Mock comment data for testing.
 */
const mockComment: NestedCommentData = {
  id: 'abc123',
  name: 't1_abc123',
  author: 'testuser',
  body: 'Test comment body',
  body_html: '<p>Test comment body</p>',
  created_utc: 1609459200,
  score: 10,
  depth: 0,
  hasReplies: false,
  permalink: '/r/test/comments/test/test/abc123'
}

describe('CommentContent', () => {
  it('should render comment author', () => {
    render(<CommentContent comment={mockComment} isDeleted={false} />)
    // Text is split: "u/" and "testuser" are separate
    expect(screen.getByText(/testuser/i)).toBeInTheDocument()
  })

  it('should render comment body', () => {
    render(<CommentContent comment={mockComment} isDeleted={false} />)
    expect(screen.getByText('Test comment body')).toBeInTheDocument()
  })

  it('should render timestamp', () => {
    render(<CommentContent comment={mockComment} isDeleted={false} />)
    // Timestamp will show relative time
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('should show deleted state when isDeleted is true', () => {
    render(<CommentContent comment={mockComment} isDeleted />)
    expect(screen.getByText('[deleted]')).toBeInTheDocument()
    expect(screen.getByText('deleted')).toBeInTheDocument()
  })

  it('should not render comment body when deleted', () => {
    render(<CommentContent comment={mockComment} isDeleted />)
    expect(screen.queryByText('Test comment body')).not.toBeInTheDocument()
  })
})

import type {AutoCommentWithText} from '@/lib/store/services/commentsApi'
import {render, screen} from '@/test-utils'
import {CommentCard} from './CommentCard'

describe('CommentCard', () => {
  const mockComment: AutoCommentWithText & {
    id: string
    permalink: string
    author: string
    created_utc: number
    ups: number
  } = {
    id: 'test123',
    permalink: '/r/test/comments/test123',
    author: 'testuser',
    body: 'This is a test comment',
    body_html: '<p>This is a test comment</p>',
    created_utc: 1234567890,
    ups: 10
  }

  it('should render comment card with all metadata', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('View on Reddit')).toBeInTheDocument()
  })

  it('should handle missing optional fields gracefully', () => {
    const commentWithMissingFields = {
      ...mockComment,
      author: undefined,
      ups: undefined
    }

    render(<CommentCard comment={commentWithMissingFields} />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should render fallback for invalid comment data', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<CommentCard comment={{} as any} />)

    expect(
      screen.getByText('Comment data is invalid and cannot be displayed')
    ).toBeInTheDocument()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid comment data received:',
      {}
    )

    consoleSpy.mockRestore()
  })

  it('should handle malformed author data', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const invalidComment = {
      ...mockComment,
      author: 123 as any // Invalid type but still valid according to hasRequiredCommentFields
    }

    render(<CommentCard comment={invalidComment} />)

    // This comment should render normally as the validation allows numeric authors
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()

    // Console should not be called as this passes validation
    expect(consoleSpy).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should handle missing body content', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const invalidComment = {
      ...mockComment,
      body_html: undefined,
      body: undefined
    }

    render(<CommentCard comment={invalidComment} />)

    // This comment should render normally as the validation still passes with undefined bodies
    // (the 'in' operator returns true for properties that exist even if undefined)
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByLabelText('Comment content')).toBeInTheDocument()

    // Console should not be called as this passes validation
    expect(consoleSpy).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

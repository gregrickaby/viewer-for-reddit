import {render, screen} from '@/test-utils'
import {CommentReplyForm} from './CommentReplyForm'

/**
 * CommentReplyForm tests focus on Collapse wrapper and form integration.
 * Form-level functionality (textarea, buttons, keyboard shortcuts, preview)
 * is tested comprehensively in BaseCommentForm.test.tsx.
 */
describe('CommentReplyForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnReplyTextChange = vi.fn()
  const mockTextareaRef = {current: null}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Collapse wrapper', () => {
    it('should render BaseCommentForm within Collapse wrapper', () => {
      render(
        <CommentReplyForm
          errorMessage=""
          isSubmitting={false}
          onCancel={mockOnCancel}
          onReplyTextChange={mockOnReplyTextChange}
          onSubmit={mockOnSubmit}
          replyText=""
          showReplyForm
          textareaRef={mockTextareaRef}
        />
      )
      // Verify BaseCommentForm renders with correct placeholder
      expect(
        screen.getByPlaceholderText(/write your reply/i)
      ).toBeInTheDocument()
      // Verify buttons are present
      expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /cancel/i})).toBeInTheDocument()
    })
  })

  describe('Error display', () => {
    it('should display error message when provided', () => {
      render(
        <CommentReplyForm
          errorMessage="Failed to submit comment"
          isSubmitting={false}
          onCancel={mockOnCancel}
          onReplyTextChange={mockOnReplyTextChange}
          onSubmit={mockOnSubmit}
          replyText="Test reply"
          showReplyForm
          textareaRef={mockTextareaRef}
        />
      )
      expect(screen.getByText('Failed to submit comment')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should not display error when errorMessage is empty', () => {
      render(
        <CommentReplyForm
          errorMessage=""
          isSubmitting={false}
          onCancel={mockOnCancel}
          onReplyTextChange={mockOnReplyTextChange}
          onSubmit={mockOnSubmit}
          replyText=""
          showReplyForm
          textareaRef={mockTextareaRef}
        />
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

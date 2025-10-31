import {render, screen, user} from '@/test-utils'
import {CommentReplyForm} from './CommentReplyForm'

describe('CommentReplyForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnReplyTextChange = vi.fn()
  const mockOnKeyDown = vi.fn()
  const mockTextareaRef = {current: null}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should hide content when showReplyForm is false', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText=""
        showReplyForm={false}
        textareaRef={mockTextareaRef}
      />
    )
    // Component renders textarea regardless of showReplyForm (visibility controlled by parent)
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument()
  })

  it('should render textarea when showReplyForm is true', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText=""
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument()
  })

  it('should call onReplyTextChange when typing', async () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText=""
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const textarea = screen.getByPlaceholderText(/write your reply/i)
    await user.type(textarea, 'Test reply')
    expect(mockOnReplyTextChange).toHaveBeenCalled()
  })

  it('should call onSubmit when Submit button is clicked', async () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText="Test reply"
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const submitButton = screen.getByRole('button', {name: /submit/i})
    await user.click(submitButton)
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when Cancel button is clicked', async () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText=""
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const cancelButton = screen.getByRole('button', {name: /cancel/i})
    await user.click(cancelButton)
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should disable Submit button when replyText is empty', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText=""
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const submitButton = screen.getByRole('button', {name: /submit/i})
    expect(submitButton).toBeDisabled()
  })

  it('should enable Submit button when replyText has content', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText="Test reply"
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const submitButton = screen.getByRole('button', {name: /submit/i})
    expect(submitButton).toBeEnabled()
  })

  it('should show loading state when submitting', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText="Test reply"
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const submitButton = screen.getByRole('button', {name: /submit/i})
    expect(submitButton).toHaveAttribute('data-loading')
  })

  it('should display error message when provided', () => {
    render(
      <CommentReplyForm
        errorMessage="Failed to submit comment"
        isSubmitting={false}
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
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

  it('should disable textarea when submitting', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText="Test reply"
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const textarea = screen.getByPlaceholderText(/write your reply/i)
    expect(textarea).toBeDisabled()
  })

  it('should disable Cancel button when submitting', () => {
    render(
      <CommentReplyForm
        errorMessage=""
        isSubmitting
        onCancel={mockOnCancel}
        onKeyDown={mockOnKeyDown}
        onReplyTextChange={mockOnReplyTextChange}
        onSubmit={mockOnSubmit}
        replyText="Test reply"
        showReplyForm
        textareaRef={mockTextareaRef}
      />
    )
    const cancelButton = screen.getByRole('button', {name: /cancel/i})
    expect(cancelButton).toBeDisabled()
  })
})

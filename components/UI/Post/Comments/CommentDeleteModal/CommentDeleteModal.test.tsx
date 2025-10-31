import {render, screen, user} from '@/test-utils'
import {CommentDeleteModal} from './CommentDeleteModal'

describe('CommentDeleteModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when opened', () => {
    render(
      <CommentDeleteModal
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        opened
      />
    )
    expect(screen.getByText('Delete Comment')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Are you sure you want to delete this comment? This action cannot be undone.'
      )
    ).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(
      <CommentDeleteModal
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        opened={false}
      />
    )
    expect(screen.queryByText('Delete Comment')).not.toBeInTheDocument()
  })

  it('should call onConfirm when Delete button is clicked', async () => {
    render(
      <CommentDeleteModal
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        opened
      />
    )
    const deleteButton = screen.getByRole('button', {name: /delete/i})
    await user.click(deleteButton)
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when Cancel button is clicked', async () => {
    render(
      <CommentDeleteModal
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        opened
      />
    )
    const cancelButton = screen.getByRole('button', {name: /cancel/i})
    await user.click(cancelButton)
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should have correct button colors', () => {
    render(
      <CommentDeleteModal
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        opened
      />
    )
    const deleteButton = screen.getByRole('button', {name: /delete/i})
    expect(deleteButton).toHaveClass('m_77c9d27d') // Mantine red button class
  })
})

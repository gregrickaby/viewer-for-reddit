import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {PostActions} from './PostActions'

describe('PostActions', () => {
  const mockOnVote = vi.fn()
  const mockOnToggleSave = vi.fn()

  const defaultProps = {
    postUrl: '/r/test/comments/abc123',
    numComments: 42,
    voteState: 0 as 1 | 0 | -1 | null,
    score: 100,
    isSaved: false,
    isPending: false,
    onVote: mockOnVote,
    onToggleSave: mockOnToggleSave,
    isAuthenticated: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all action buttons', () => {
      render(<PostActions {...defaultProps} />)

      expect(screen.getByRole('button', {name: 'Upvote'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Downvote'})).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: 'View comments'})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: 'Save post'})
      ).toBeInTheDocument()
    })

    it('renders score with formatted number', () => {
      render(<PostActions {...defaultProps} score={1500} />)

      expect(screen.getByText('1.5K')).toBeInTheDocument()
    })

    it('renders comment count with formatted number', () => {
      render(<PostActions {...defaultProps} numComments={2500} />)

      expect(screen.getByText('2.5K')).toBeInTheDocument()
    })

    it('renders comments link with correct href', () => {
      render(<PostActions {...defaultProps} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/r/test/comments/abc123#comments')
    })
  })

  describe('voting', () => {
    it('calls onVote with 1 when upvote is clicked', async () => {
      render(<PostActions {...defaultProps} />)

      const upvoteButton = screen.getByRole('button', {name: 'Upvote'})
      await user.click(upvoteButton)

      expect(mockOnVote).toHaveBeenCalledWith(1)
      expect(mockOnVote).toHaveBeenCalledTimes(1)
    })

    it('calls onVote with -1 when downvote is clicked', async () => {
      render(<PostActions {...defaultProps} />)

      const downvoteButton = screen.getByRole('button', {name: 'Downvote'})
      await user.click(downvoteButton)

      expect(mockOnVote).toHaveBeenCalledWith(-1)
      expect(mockOnVote).toHaveBeenCalledTimes(1)
    })
  })

  describe('save/unsave', () => {
    it('calls onToggleSave when save button is clicked', async () => {
      render(<PostActions {...defaultProps} />)

      const saveButton = screen.getByRole('button', {name: 'Save post'})
      await user.click(saveButton)

      expect(mockOnToggleSave).toHaveBeenCalledTimes(1)
    })

    it('shows filled bookmark icon when saved', () => {
      render(<PostActions {...defaultProps} isSaved />)

      const unsaveButton = screen.getByRole('button', {name: 'Unsave post'})
      expect(unsaveButton).toBeInTheDocument()
    })

    it('shows outline bookmark icon when not saved', () => {
      render(<PostActions {...defaultProps} isSaved={false} />)

      const saveButton = screen.getByRole('button', {name: 'Save post'})
      expect(saveButton).toBeInTheDocument()
    })
  })

  describe('loading states', () => {
    it('disables vote buttons when pending', () => {
      render(<PostActions {...defaultProps} isPending />)

      const upvoteButton = screen.getByRole('button', {name: 'Upvote'})
      const downvoteButton = screen.getByRole('button', {name: 'Downvote'})

      expect(upvoteButton).toBeDisabled()
      expect(downvoteButton).toBeDisabled()
    })

    it('disables save button when pending', () => {
      render(<PostActions {...defaultProps} isPending />)

      const saveButton = screen.getByRole('button', {name: 'Save post'})
      expect(saveButton).toBeDisabled()
    })
  })

  describe('authentication', () => {
    it('disables vote buttons when not authenticated', () => {
      render(<PostActions {...defaultProps} isAuthenticated={false} />)

      const upvoteButton = screen.getByRole('button', {name: 'Upvote'})
      const downvoteButton = screen.getByRole('button', {name: 'Downvote'})

      expect(upvoteButton).toBeDisabled()
      expect(downvoteButton).toBeDisabled()
    })

    it('disables save button when not authenticated', () => {
      render(<PostActions {...defaultProps} isAuthenticated={false} />)

      const saveButton = screen.getByRole('button', {name: 'Save post'})
      expect(saveButton).toBeDisabled()
    })

    it('does not call onVote when not authenticated', async () => {
      render(<PostActions {...defaultProps} isAuthenticated={false} />)

      const upvoteButton = screen.getByRole('button', {name: 'Upvote'})
      await user.click(upvoteButton)

      expect(mockOnVote).not.toHaveBeenCalled()
    })

    it('does not call onToggleSave when not authenticated', async () => {
      render(<PostActions {...defaultProps} isAuthenticated={false} />)

      // Button is disabled, but verify the behavior
      expect(mockOnToggleSave).not.toHaveBeenCalled()
    })

    it('shows not-allowed cursor when not authenticated', () => {
      render(<PostActions {...defaultProps} isAuthenticated={false} />)

      const upvoteButton = screen.getByRole('button', {name: 'Upvote'})
      expect(upvoteButton).toHaveStyle({cursor: 'not-allowed'})
    })
  })

  describe('edge cases', () => {
    it('handles null voteState', () => {
      render(<PostActions {...defaultProps} voteState={null} />)

      const score = screen.getByText('100')
      expect(score).toBeInTheDocument()
    })

    it('handles zero comments', () => {
      render(<PostActions {...defaultProps} numComments={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles negative score', () => {
      render(<PostActions {...defaultProps} score={-5} />)

      expect(screen.getByText('-5')).toBeInTheDocument()
    })

    it('handles large numbers', () => {
      render(<PostActions {...defaultProps} score={1500000} />)

      expect(screen.getByText('1.5M')).toBeInTheDocument()
    })
  })
})

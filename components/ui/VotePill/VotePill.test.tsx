import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {VotePill} from './VotePill'

describe('VotePill', () => {
  const mockOnVote = vi.fn()

  const defaultProps = {
    voteState: 0 as 1 | 0 | -1 | null,
    score: 100,
    isPending: false,
    onVote: mockOnVote,
    upvoteLabel: 'Upvote',
    downvoteLabel: 'Downvote'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the formatted score', () => {
    render(<VotePill {...defaultProps} score={1500} />)

    expect(screen.getByText('1.5K')).toBeInTheDocument()
  })

  it('renders upvote and downvote buttons using the provided labels', () => {
    render(
      <VotePill
        {...defaultProps}
        upvoteLabel="Upvote comment (100 points)"
        downvoteLabel="Downvote comment (100 points)"
      />
    )

    expect(
      screen.getByRole('button', {name: 'Upvote comment (100 points)'})
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Downvote comment (100 points)'})
    ).toBeInTheDocument()
  })

  it('calls onVote with 1 when upvote is clicked', async () => {
    render(<VotePill {...defaultProps} />)

    await user.click(screen.getByRole('button', {name: 'Upvote'}))

    expect(mockOnVote).toHaveBeenCalledWith(1)
    expect(mockOnVote).toHaveBeenCalledTimes(1)
  })

  it('calls onVote with -1 when downvote is clicked', async () => {
    render(<VotePill {...defaultProps} />)

    await user.click(screen.getByRole('button', {name: 'Downvote'}))

    expect(mockOnVote).toHaveBeenCalledWith(-1)
    expect(mockOnVote).toHaveBeenCalledTimes(1)
  })

  it('disables both vote buttons when pending', () => {
    render(<VotePill {...defaultProps} isPending />)

    expect(screen.getByRole('button', {name: 'Upvote'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Downvote'})).toBeDisabled()
  })

  it('handles a negative score', () => {
    render(<VotePill {...defaultProps} score={-5} />)

    expect(screen.getByText('-5')).toBeInTheDocument()
  })
})

import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import {render, screen, userEvent} from '@/test-utils'

// Mock the vote mutation
const mockVote = vi.fn()
vi.mock('@/lib/store/services/voteApi', async (importOriginal) => {
  const actual: Record<string, unknown> =
    await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useVoteMutation: () => [
      mockVote,
      {
        isLoading: false
      }
    ]
  }
})

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

describe('VoteButtons', () => {
  beforeEach(() => {
    mockVote.mockClear()
    mockVote.mockReturnValue({unwrap: vi.fn().mockResolvedValue({})})
  })

  it('should render upvote and downvote buttons with score', () => {
    render(<VoteButtons id="t3_abc123" score={42} />)

    expect(screen.getByLabelText('Upvote')).toBeInTheDocument()
    expect(screen.getByLabelText('Downvote')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should show upvoted state when userVote is true', () => {
    // eslint-disable-next-line react/jsx-boolean-value
    render(<VoteButtons id="t3_abc123" score={42} userVote={true} />)

    const upvoteButton = screen.getByLabelText('Upvote')
    expect(upvoteButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should show downvoted state when userVote is false', () => {
    render(<VoteButtons id="t3_abc123" score={42} userVote={false} />)

    const downvoteButton = screen.getByLabelText('Downvote')
    expect(downvoteButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should call vote mutation when upvote button is clicked', async () => {
    const user = userEvent.setup()
    render(<VoteButtons id="t3_abc123" score={42} />)

    const upvoteButton = screen.getByLabelText('Upvote')
    await user.click(upvoteButton)

    expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 1})
  })

  it('should call vote mutation when downvote button is clicked', async () => {
    const user = userEvent.setup()
    render(<VoteButtons id="t3_abc123" score={42} />)

    const downvoteButton = screen.getByLabelText('Downvote')
    await user.click(downvoteButton)

    expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: -1})
  })

  it('should unvote when clicking upvote button while already upvoted', async () => {
    const user = userEvent.setup()
    // eslint-disable-next-line react/jsx-boolean-value
    render(<VoteButtons id="t3_abc123" score={42} userVote={true} />)

    const upvoteButton = screen.getByLabelText('Upvote')
    await user.click(upvoteButton)

    expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 0})
  })

  it('should unvote when clicking downvote button while already downvoted', async () => {
    const user = userEvent.setup()
    render(<VoteButtons id="t3_abc123" score={42} userVote={false} />)

    const downvoteButton = screen.getByLabelText('Downvote')
    await user.click(downvoteButton)

    expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 0})
  })

  it('should optimistically update score when upvoting', async () => {
    const user = userEvent.setup()
    render(<VoteButtons id="t3_abc123" score={42} />)

    const upvoteButton = screen.getByLabelText('Upvote')
    await user.click(upvoteButton)

    // Score should increase by 1
    expect(screen.getByText('43')).toBeInTheDocument()
  })

  it('should optimistically update score when downvoting', async () => {
    const user = userEvent.setup()
    render(<VoteButtons id="t3_abc123" score={42} />)

    const downvoteButton = screen.getByLabelText('Downvote')
    await user.click(downvoteButton)

    // Score should decrease by 1
    expect(screen.getByText('41')).toBeInTheDocument()
  })

  it('should format large scores with thousand separators', () => {
    render(<VoteButtons id="t3_abc123" score={1234567} />)

    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})

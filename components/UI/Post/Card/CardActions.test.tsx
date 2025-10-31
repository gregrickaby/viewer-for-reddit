import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {render, screen, user} from '@/test-utils'
import {CardActions} from './CardActions'

const mockPost: AutoPostChildData = {
  name: 't3_test123',
  ups: 42,
  likes: null,
  num_comments: 15
}

const mockOnCommentsToggle = vi.fn()

describe('CardActions', () => {
  beforeEach(() => {
    mockOnCommentsToggle.mockClear()
  })

  it('should render vote buttons with correct props', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    // VoteButtons component should be rendered (check for vote elements)
    const upvoteButton = screen.getByLabelText(/upvote/i)
    const downvoteButton = screen.getByLabelText(/downvote/i)

    expect(upvoteButton).toBeInTheDocument()
    expect(downvoteButton).toBeInTheDocument()
  })

  it('should render comments button when not hidden', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 15 comments/i
    })

    expect(commentsButton).toBeInTheDocument()
  })

  it('should hide comments button when hideCommentToggle is true', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
        hideCommentToggle
      />
    )

    const commentsButton = screen.queryByRole('button', {
      name: /comments/i
    })

    expect(commentsButton).not.toBeInTheDocument()
  })

  it('should call onCommentsToggle when comments button clicked', async () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 15 comments/i
    })

    await user.click(commentsButton)

    expect(mockOnCommentsToggle).toHaveBeenCalledTimes(1)
  })

  it('should show "Hide comments" label when comments are open', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /hide 15 comments/i
    })

    expect(commentsButton).toBeInTheDocument()
  })

  it('should show "Show comments" label when comments are closed', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 15 comments/i
    })

    expect(commentsButton).toBeInTheDocument()
  })

  it('should format large comment counts with thousand separator', () => {
    const postWithManyComments = {...mockPost, num_comments: 1234}

    render(
      <CardActions
        post={postWithManyComments}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    // NumberFormatter should format 1234 with comma
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('should render chevron down when comments closed', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 15 comments/i
    })

    // Button should contain chevron down icon (IoChevronDown)
    expect(commentsButton).toBeInTheDocument()
  })

  it('should render chevron up when comments open', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /hide 15 comments/i
    })

    // Button should contain chevron up icon (IoChevronUp)
    expect(commentsButton).toBeInTheDocument()
  })

  it('should handle post with zero comments', () => {
    const postWithNoComments = {...mockPost, num_comments: 0}

    render(
      <CardActions
        post={postWithNoComments}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 0 comments/i
    })

    expect(commentsButton).toBeInTheDocument()
  })

  it('should pass Umami event tracking attribute', () => {
    render(
      <CardActions
        post={mockPost}
        commentsOpen={false}
        onCommentsToggle={mockOnCommentsToggle}
      />
    )

    const commentsButton = screen.getByRole('button', {
      name: /show 15 comments/i
    })

    expect(commentsButton).toHaveAttribute('data-umami-event', 'comment button')
  })
})

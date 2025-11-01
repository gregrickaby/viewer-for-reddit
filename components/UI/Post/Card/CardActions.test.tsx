import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {render, screen} from '@/test-utils'
import {CardActions} from './CardActions'

const mockPost: AutoPostChildData = {
  name: 't3_test123',
  ups: 42,
  likes: null,
  num_comments: 15
}

describe('CardActions', () => {
  it('should render vote buttons with correct props', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const upvoteButton = screen.getByLabelText(/upvote/i)
    const downvoteButton = screen.getByLabelText(/downvote/i)

    expect(upvoteButton).toBeInTheDocument()
    expect(downvoteButton).toBeInTheDocument()
  })

  it('should render comments link when not hidden', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const commentsLink = screen.getByRole('link', {
      name: /15 comments/i
    })

    expect(commentsLink).toBeInTheDocument()
    expect(commentsLink).toHaveAttribute(
      'href',
      '/r/test/comments/test123#comments'
    )
  })

  it('should hide comments link when hideCommentToggle is true', () => {
    render(
      <CardActions
        hideCommentToggle
        post={mockPost}
        postLink="/r/test/comments/test123"
      />
    )

    const commentsLink = screen.queryByRole('link', {
      name: /comments/i
    })

    expect(commentsLink).not.toBeInTheDocument()
  })

  it('should format large comment counts with thousand separator', () => {
    const postWithManyComments = {...mockPost, num_comments: 1234}

    render(
      <CardActions
        post={postWithManyComments}
        postLink="/r/test/comments/test123"
      />
    )

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('should handle post with zero comments', () => {
    const postWithNoComments = {...mockPost, num_comments: 0}

    render(
      <CardActions
        post={postWithNoComments}
        postLink="/r/test/comments/test123"
      />
    )

    const commentsLink = screen.getByRole('link', {
      name: /0 comments/i
    })

    expect(commentsLink).toBeInTheDocument()
  })

  it('should pass Umami event tracking attribute', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const commentsLink = screen.getByRole('link', {
      name: /15 comments/i
    })

    expect(commentsLink).toHaveAttribute(
      'data-umami-event',
      'view comment button'
    )
  })
})

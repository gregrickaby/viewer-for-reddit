import {render, screen} from '@/test-utils'
import {CommentsEmpty} from './CommentsEmpty'

describe('CommentsEmpty', () => {
  describe('when user is not authenticated', () => {
    it('should render no comments message for unauthenticated users', () => {
      render(<CommentsEmpty />)

      expect(
        screen.getByText(
          'No comments to display. Be the first to comment on Reddit!'
        )
      ).toBeInTheDocument()
    })

    it('should not render comment form', () => {
      render(<CommentsEmpty postId="t3_abc123" />)

      expect(
        screen.queryByRole('button', {name: /add a comment/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated', () => {
    const authenticatedState = {
      auth: {
        isAuthenticated: true,
        username: 'testuser',
        expiresAt: Date.now() + 3600000
      }
    }

    it('should render no comments message for authenticated users', () => {
      render(<CommentsEmpty />, {preloadedState: authenticatedState})

      expect(
        screen.getByText('No comments to display. Be the first to comment!')
      ).toBeInTheDocument()
    })

    it('should render comment form when postId is provided', () => {
      render(<CommentsEmpty postId="t3_abc123" />, {
        preloadedState: authenticatedState
      })

      expect(
        screen.getByRole('button', {name: /add a comment/i})
      ).toBeInTheDocument()
    })

    it('should not render comment form when postId is not provided', () => {
      render(<CommentsEmpty />, {preloadedState: authenticatedState})

      expect(
        screen.queryByRole('button', {name: /add a comment/i})
      ).not.toBeInTheDocument()
    })
  })

  it('should have accessible output element', () => {
    render(<CommentsEmpty />)

    const output = screen.getByRole('status')
    expect(output).toHaveAttribute('aria-label', 'No comments available')
    expect(output).toHaveAttribute('aria-describedby', 'empty-description')
  })

  it('should render dimmed text with correct id', () => {
    render(<CommentsEmpty />)

    const text = screen.getByText(
      'No comments to display. Be the first to comment on Reddit!'
    )
    expect(text).toHaveAttribute('id', 'empty-description')
  })
})

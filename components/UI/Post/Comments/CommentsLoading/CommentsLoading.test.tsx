import {render, screen} from '@/test-utils'
import {CommentsLoading} from './CommentsLoading'

describe('CommentsLoading', () => {
  it('should render loading state', () => {
    render(<CommentsLoading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render accessibility description', () => {
    render(<CommentsLoading />)

    expect(
      screen.getByText('Loading comments. Please wait.')
    ).toBeInTheDocument()
  })

  it('should have aria-live and aria-busy attributes', () => {
    render(<CommentsLoading />)

    const output = screen.getByRole('status')
    expect(output).toHaveAttribute('aria-live', 'polite')
    expect(output).toHaveAttribute('aria-busy', 'true')
  })
})

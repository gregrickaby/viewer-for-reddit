import {render, screen} from '@/test-utils'
import {CommentsEmpty} from './CommentsEmpty'

describe('CommentsEmpty', () => {
  it('should render no comments message', () => {
    render(<CommentsEmpty />)

    expect(
      screen.getByText(
        'No comments to display. Be the first to comment on Reddit!'
      )
    ).toBeInTheDocument()
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

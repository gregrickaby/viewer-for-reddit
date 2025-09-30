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
})

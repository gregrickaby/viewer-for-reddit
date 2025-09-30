import {render, screen} from '@/test-utils'
import {CommentsLoading} from './CommentsLoading'

describe('CommentsLoading', () => {
  it('should render loading spinner with accessibility label', () => {
    render(<CommentsLoading />)

    // Mantine Loader doesn't have role="status" by default, check aria-label instead
    expect(screen.getByLabelText('Loading comments...')).toBeInTheDocument()
  })
})

import {MediaContainer} from '@/components/MediaContainer/MediaContainer'
import {render, screen} from '@/test-utils'

describe('MediaContainer', () => {
  it('renders children', () => {
    render(
      <MediaContainer>
        <p>content</p>
      </MediaContainer>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

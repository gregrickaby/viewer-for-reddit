import {YouTubePlayer} from '@/components/YouTubePlayer/YouTubePlayer'
import {render, screen} from '@/test-utils'

vi.mock('@mantine/hooks', () => ({
  useInViewport: () => ({ref: vi.fn(), inViewport: true})
}))

describe('YouTubePlayer', () => {
  it('renders thumbnail button when in viewport', () => {
    render(<YouTubePlayer videoId="abc" />)
    expect(
      screen.getByRole('button', {name: 'Play YouTube video'})
    ).toBeInTheDocument()
  })
})

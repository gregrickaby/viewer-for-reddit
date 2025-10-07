import {YouTubePlayer} from '@/components/UI/Post/Media/YouTubePlayer/YouTubePlayer'
import {render, screen} from '@/test-utils'

const {mockUseInViewport} = vi.hoisted(() => ({
  mockUseInViewport: vi.fn()
}))
vi.mock('@mantine/hooks', () => ({
  useInViewport: () => ({ref: {current: null}, inViewport: mockUseInViewport()})
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('YouTubePlayer', () => {
  it('renders thumbnail button when in viewport', () => {
    mockUseInViewport.mockReturnValueOnce(true)
    render(<YouTubePlayer videoId="abc" />)
    expect(
      screen.getByRole('button', {name: 'Play YouTube video'})
    ).toBeInTheDocument()
  })

  it('renders iframe when not in viewport', () => {
    mockUseInViewport.mockReturnValueOnce(false)
    render(<YouTubePlayer videoId="abc" />)
    expect(screen.getByTitle('YouTube video player')).toBeInTheDocument()
  })
})

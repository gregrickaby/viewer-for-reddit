import {HlsPlayer} from '@/components/UI/Post/Media/HlsPlayer/HlsPlayer'
import {render, screen, waitFor} from '@/test-utils'

const videoRef = {current: null}
vi.mock('@/lib/hooks/useHlsVideo', () => ({
  useHlsVideo: () => ({videoRef, isLoading: false, isMuted: false})
}))

vi.mock('media-chrome', () => ({}))

describe('HlsPlayer', () => {
  it('renders video element initially', () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    // Initially shows fallback video element before media-chrome loads
    expect(screen.getByTestId('video')).toBeInTheDocument()
  })

  it('shows media-chrome controls after loading', async () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('media-control-bar')).toBeInTheDocument()
    })

    expect(screen.getByTestId('video')).not.toHaveAttribute('controls')
  })
})

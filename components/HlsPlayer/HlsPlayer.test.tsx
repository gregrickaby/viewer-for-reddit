import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {render, screen, waitFor} from '@/test-utils'

const videoRef = {current: null}
vi.mock('@/lib/hooks/useHlsVideo', () => ({
  useHlsVideo: () => ({videoRef, isLoading: false, isMuted: false})
}))

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
    // Mock successful media-chrome import
    vi.doMock('media-chrome', () => ({}))

    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    // Wait for media-chrome to load
    await waitFor(() => {
      expect(screen.getByTestId('media-controller')).toBeInTheDocument()
    })

    expect(screen.getByTestId('video')).toBeInTheDocument()
  })
})

import {HlsPlayer} from '@/components/UI/Post/Media/HlsPlayer/HlsPlayer'
import {render, screen} from '@/test-utils'

// Mock dynamic import of media-chrome to prevent web component registration
vi.mock('media-chrome', () => ({
  __esModule: true,
  default: {}
}))

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

    // Video element should be present
    expect(screen.getByTestId('video')).toBeInTheDocument()
  })

  it('renders media-controller wrapper', () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    // Media controller should be present
    expect(screen.getByTestId('media-controller')).toBeInTheDocument()
  })

  it('shows native controls when media-chrome fails to load', () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    // When media-chrome doesn't load, native controls should be enabled
    const video = screen.getByTestId('video')
    expect(video).toHaveAttribute('controls')
  })

  it('applies correct video attributes', () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
        loop
        playsInline
        preload="none"
      />
    )

    const video = screen.getByTestId('video')
    expect(video).toHaveAttribute('poster', 'poster.jpg')
    expect(video).toHaveAttribute('id', '123')
    expect(video).toHaveAttribute('data-hint', 'video')
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('preload', 'none')
  })
})

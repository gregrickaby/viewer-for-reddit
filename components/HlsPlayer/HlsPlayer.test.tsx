import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {render} from '@/test-utils'

const videoRef = {current: null}
vi.mock('@/lib/hooks/useHlsVideo', () => ({
  useHlsVideo: () => ({videoRef, isLoading: false, isMuted: false})
}))

describe('HlsPlayer', () => {
  it('renders video element', () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="123"
        dataHint="video"
      />
    )

    expect(
      // eslint-disable-next-line testing-library/no-node-access
      document.querySelector('video')
    ).toBeInTheDocument()
  })
})

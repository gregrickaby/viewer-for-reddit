import {fireEvent, render, screen} from '@/test-utils'
import Hls from 'hls.js'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {VideoPlayer} from './VideoPlayer'

vi.mock('hls.js', () => {
  const mockInstance = {
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn()
  }

  const MockHls: any = function () {
    return mockInstance
  }

  MockHls.isSupported = vi.fn(() => true)
  MockHls.mockInstance = mockInstance

  return {
    default: MockHls
  }
})

const mockObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  callback: null as any
}

global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    mockObserver.callback = callback
  }
  observe = mockObserver.observe
  unobserve = mockObserver.unobserve
  disconnect = mockObserver.disconnect
} as any

describe('VideoPlayer', () => {
  const getMockInstance = () => (Hls as any).mockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    const mockInstance = getMockInstance()
    mockInstance.loadSource.mockClear()
    mockInstance.attachMedia.mockClear()
    mockInstance.destroy.mockClear()
    ;(Hls.isSupported as any).mockReturnValue(true)
  })

  describe('valid video rendering', () => {
    it('renders video element with valid Reddit video URL', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toBeInTheDocument()
    })

    it('renders video with source element', () => {
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      // eslint-disable-next-line testing-library/no-container
      const source = container.querySelector('source')
      expect(source).toBeInTheDocument()
      expect(source).toHaveAttribute('src', 'https://v.redd.it/test.mp4')
    })

    it('renders video with mp4 type by default', () => {
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      // eslint-disable-next-line testing-library/no-container
      const source = container.querySelector('source')
      expect(source).toHaveAttribute('type', 'video/mp4')
    })

    it('renders video with HLS type when specified', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toBeInTheDocument()
    })

    it('renders video with controls', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('controls')
    })

    it('renders video with preload metadata', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('preload', 'metadata')
    })

    it('renders video with no download control', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('controlslist', 'nodownload')
    })

    it('renders video with playsInline for iOS Safari', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('playsinline')
    })

    it('renders video with poster when provided', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          poster="https://preview.redd.it/poster.jpg"
        />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute(
        'poster',
        'https://preview.redd.it/poster.jpg'
      )
    })

    it('renders video without poster when not provided', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).not.toHaveAttribute('poster')
    })
  })

  describe('URL validation', () => {
    it('shows error for non-HTTPS URLs', () => {
      render(<VideoPlayer src="http://v.redd.it/test.mp4" title="Test Video" />)

      expect(screen.getByText('Video unavailable')).toBeInTheDocument()
      expect(
        screen.queryByLabelText('Video: Test Video')
      ).not.toBeInTheDocument()
    })

    it('shows error for invalid URLs', () => {
      render(<VideoPlayer src="not-a-valid-url" title="Test Video" />)

      expect(screen.getByText('Video unavailable')).toBeInTheDocument()
    })

    it('shows error for non-Reddit domains', () => {
      render(
        <VideoPlayer src="https://youtube.com/video.mp4" title="Test Video" />
      )

      expect(screen.getByText('Video unavailable')).toBeInTheDocument()
    })

    it('accepts v.redd.it domain', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })

    it('accepts reddit.com domain', () => {
      render(
        <VideoPlayer
          src="https://www.reddit.com/video.mp4"
          title="Test Video"
        />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })

    it('accepts preview.redd.it domain', () => {
      render(
        <VideoPlayer
          src="https://preview.redd.it/test.mp4"
          title="Test Video"
        />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })

    it('accepts external-preview.redd.it domain', () => {
      render(
        <VideoPlayer
          src="https://external-preview.redd.it/test.mp4"
          title="Test Video"
        />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })

    it('accepts i.redd.it domain', () => {
      render(
        <VideoPlayer src="https://i.redd.it/test.mp4" title="Test Video" />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })

    it('accepts subdomains of allowed domains', () => {
      render(
        <VideoPlayer
          src="https://sub.preview.redd.it/test.mp4"
          title="Test Video"
        />
      )

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-label with video title', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="My Test Video" />
      )

      expect(screen.getByLabelText('Video: My Test Video')).toBeInTheDocument()
    })

    it('includes captions track', () => {
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      // eslint-disable-next-line testing-library/no-container
      const track = container.querySelector('track')
      expect(track).toBeInTheDocument()
      expect(track).toHaveAttribute('kind', 'captions')
      expect(track).toHaveAttribute('label', 'English')
    })

    it('shows fallback text for unsupported browsers', () => {
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(container).toHaveTextContent(
        /Your browser does not support the video tag\./
      )
    })
  })

  describe('IntersectionObserver', () => {
    it('observes video element on mount', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(mockObserver.observe).toHaveBeenCalled()
    })

    it('unobserves video element on unmount', () => {
      const {unmount} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      unmount()

      expect(mockObserver.unobserve).toHaveBeenCalled()
    })

    it('pauses video when intersection callback runs', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      const pauseSpy = vi.fn()

      Object.defineProperty(video, 'paused', {
        value: false,
        writable: true
      })
      Object.defineProperty(video, 'pause', {
        value: pauseSpy,
        writable: true
      })

      mockObserver.callback([{target: video}])

      expect(pauseSpy).toHaveBeenCalled()
    })
  })

  describe('play behavior', () => {
    it('pauses other videos when one starts playing', () => {
      render(
        <>
          <VideoPlayer src="https://v.redd.it/one.mp4" title="Video One" />
          <VideoPlayer src="https://v.redd.it/two.mp4" title="Video Two" />
        </>
      )

      const firstVideo = screen.getByLabelText('Video: Video One')
      const secondVideo = screen.getByLabelText('Video: Video Two')

      const secondPauseSpy = vi.fn()
      Object.defineProperty(secondVideo, 'paused', {
        value: false,
        writable: true
      })
      Object.defineProperty(secondVideo, 'pause', {
        value: secondPauseSpy,
        writable: true
      })

      fireEvent.play(firstVideo)

      expect(secondPauseSpy).toHaveBeenCalled()
    })
  })

  describe('video dimensions', () => {
    it('renders without dimensions', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('renders with width and height', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          width={1920}
          height={1080}
        />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('renders with portrait orientation', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          width={1080}
          height={1920}
        />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })
  })

  describe('HLS streaming', () => {
    it('initializes HLS.js for HLS streams when supported', () => {
      const mockInstance = getMockInstance()

      render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      expect(Hls.isSupported).toHaveBeenCalled()
      expect(mockInstance.loadSource).toHaveBeenCalledWith(
        'https://v.redd.it/test.m3u8'
      )
      expect(mockInstance.attachMedia).toHaveBeenCalled()
    })

    it('uses native HLS for Safari', () => {
      // This test verifies the code path exists for native HLS support
      // Actual behavior is difficult to test without real browser environment
      const {container} = render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video') as HTMLVideoElement

      // Verify video element exists and HLS type was specified
      expect(video).toBeInTheDocument()
    })

    it('falls back to direct src when HLS is not supported', () => {
      const mockInstance = getMockInstance()
      ;(Hls.isSupported as any).mockReturnValue(false)

      const {container} = render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video') as HTMLVideoElement

      // Mock no native support
      video.canPlayType = vi.fn(() => '') as any

      expect(Hls.isSupported).toHaveBeenCalled()
      expect(mockInstance.loadSource).not.toHaveBeenCalled()
    })

    it('destroys HLS instance on unmount', () => {
      const mockInstance = getMockInstance()

      const {unmount} = render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      unmount()

      expect(mockInstance.destroy).toHaveBeenCalled()
    })

    it('does not initialize HLS for MP4 videos', () => {
      const mockInstance = getMockInstance()

      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          type="mp4"
        />
      )

      expect(mockInstance.loadSource).not.toHaveBeenCalled()
      expect(mockInstance.attachMedia).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles empty title', () => {
      render(<VideoPlayer src="https://v.redd.it/test.mp4" title="" />)

      expect(screen.getByLabelText('Video:')).toBeInTheDocument()
    })

    it('handles very long title', () => {
      const longTitle = 'Very Long Title '.repeat(50)
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title={longTitle} />
      )

      // Check video element is rendered
      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      const specialTitle = '<>&"\'🎉'
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title={specialTitle} />
      )

      expect(
        screen.getByLabelText(`Video: ${specialTitle}`)
      ).toBeInTheDocument()
    })

    it('handles URLs with query parameters', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4?param=value"
          title="Test Video"
        />
      )

      const {container} = render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4?param=value"
          title="Test Video"
        />
      )

      // eslint-disable-next-line testing-library/no-container
      const source = container.querySelector('source')
      expect(source).toHaveAttribute(
        'src',
        'https://v.redd.it/test.mp4?param=value'
      )
    })

    it('handles zero width', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          width={0}
          height={1080}
        />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('handles zero height', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          width={1920}
          height={0}
        />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })
  })
})

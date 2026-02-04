import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {VideoPlayer} from './VideoPlayer'

// Mock the useVideoPlayer hook to focus on component rendering
vi.mock('@/lib/hooks', () => ({
  useVideoPlayer: vi.fn(() => ({current: null}))
}))

describe('VideoPlayer', () => {
  describe('rendering with valid URLs', () => {
    it('renders video element with valid Reddit video URL', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('renders video with source element for mp4', () => {
      const {container} = render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      // eslint-disable-next-line testing-library/no-container
      const source = container.querySelector('source')
      expect(source).toBeInTheDocument()
      expect(source).toHaveAttribute('src', 'https://v.redd.it/test.mp4')
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

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('renders video with controls enabled', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('controls')
    })

    it('renders video with preload none for performance', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('preload', 'none')
    })

    it('renders video with playsInline for mobile compatibility', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('playsinline')
    })

    it('renders video with poster image', () => {
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

    it('renders video with dimensions', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.mp4"
          title="Test Video"
          width={1920}
          height={1080}
        />
      )

      const video = screen.getByLabelText('Video: Test Video')
      expect(video).toHaveAttribute('width', '1920')
      expect(video).toHaveAttribute('height', '1080')
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

    it('includes captions track for accessibility', () => {
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
})

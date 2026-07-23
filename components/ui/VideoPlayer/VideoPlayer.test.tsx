import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {VideoPlayer} from './VideoPlayer'

// Player internals (video.js) are covered by useVideoPlayer.test.tsx;
// mock the hook here to isolate the component's own rendering logic.
vi.mock('@/lib/hooks/useVideoPlayer', () => ({
  useVideoPlayer: vi.fn(() => ({current: null}))
}))

describe('VideoPlayer', () => {
  describe('rendering with valid URLs', () => {
    it('renders the player container for a valid Reddit video URL', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
    })

    it('renders for HLS type', () => {
      render(
        <VideoPlayer
          src="https://v.redd.it/test.m3u8"
          title="Test Video"
          type="hls"
        />
      )

      expect(screen.getByLabelText('Video: Test Video')).toBeInTheDocument()
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
  })
})

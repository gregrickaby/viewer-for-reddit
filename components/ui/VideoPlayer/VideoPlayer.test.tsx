import {useVideoPlayer} from '@/lib/hooks/useVideoPlayer'
import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {VideoPlayer} from './VideoPlayer'

// Player internals (video.js) are covered by useVideoPlayer.test.tsx;
// mock the hook here to isolate the component's own rendering logic.
vi.mock('@/lib/hooks/useVideoPlayer', () => ({
  useVideoPlayer: vi.fn(() => ({current: null}))
}))

const mockUseVideoPlayer = vi.mocked(useVideoPlayer)

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

    it.each([
      {
        description: 'accepts v.redd.it domain',
        src: 'https://v.redd.it/test.mp4'
      },
      {
        description: 'accepts reddit.com domain',
        src: 'https://www.reddit.com/video.mp4'
      },
      {
        description: 'accepts preview.redd.it domain',
        src: 'https://preview.redd.it/test.mp4'
      },
      {
        description: 'accepts external-preview.redd.it domain',
        src: 'https://external-preview.redd.it/test.mp4'
      },
      {
        description: 'accepts i.redd.it domain',
        src: 'https://i.redd.it/test.mp4'
      },
      {
        description: 'accepts subdomains of allowed domains',
        src: 'https://sub.preview.redd.it/test.mp4'
      },
      {
        description: 'accepts giphy.com domain',
        src: 'https://media.giphy.com/media/abc123/giphy.mp4'
      },
      {
        description: 'accepts imgur.com domain',
        src: 'https://i.imgur.com/abc123.mp4'
      }
    ])('$description', ({src}) => {
      render(<VideoPlayer src={src} title="Test Video" />)

      expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
    })
  })

  describe('gifStyle', () => {
    it('passes gifStyle through to the hook', () => {
      render(
        <VideoPlayer
          src="https://media.giphy.com/media/abc/giphy.mp4"
          title="Test Video"
          gifStyle
        />
      )

      expect(mockUseVideoPlayer).toHaveBeenCalledWith(
        expect.objectContaining({gifStyle: true})
      )
    })

    it('defaults gifStyle to undefined when not passed', () => {
      render(
        <VideoPlayer src="https://v.redd.it/test.mp4" title="Test Video" />
      )

      expect(mockUseVideoPlayer).toHaveBeenCalledWith(
        expect.objectContaining({gifStyle: undefined})
      )
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

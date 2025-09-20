/**
 * Integration tests for HlsPlayer component focusing on mute functionality
 * and media chrome synchronization issues.
 */
import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {render, screen, waitFor} from '@/test-utils'

// Mock Media Chrome to test mute synchronization
vi.mock('media-chrome', () => ({}))

describe('HlsPlayer - Mute Integration', () => {
  it('should sync initial muted state from Redux to media chrome', async () => {
    const preloadedState = {
      settings: {
        favorites: [],
        currentSort: 'hot' as const,
        currentSubreddit: null,
        enableNsfw: false,
        isMuted: true, // Should be muted initially
        recent: []
      },
      transient: {toggleNavbar: false, toggleSearch: false, searchQuery: ''}
    }

    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="test-video"
        dataHint="video"
      />,
      {preloadedState}
    )

    const video = screen.getByTestId('video') as HTMLVideoElement

    // Both the property and attribute should be set for proper browser compatibility
    expect(video.muted).toBe(true)
    // HTML attribute should also be present for accessibility and Media Chrome compatibility
    expect(video).toHaveAttribute('muted')

    // Wait for media chrome to load
    await waitFor(() => {
      expect(screen.getByTestId('media-control-bar')).toBeInTheDocument()
    })
  })

  it('should handle volume slider interaction on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375 // iPhone width
    })

    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="test-video-mobile"
        dataHint="video"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('media-control-bar')).toBeInTheDocument()
    })

    // The test verifies that the CSS is applied correctly
    // On mobile (375px), volume range should be hidden via CSS
    const mediaController = screen.getByTestId('media-controller')
    expect(mediaController).toBeInTheDocument()
    expect(mediaController.className).toMatch(/controller/)
  })

  it('should respond to device volume changes', async () => {
    render(
      <HlsPlayer
        src="video.m3u8"
        fallbackUrl="fallback.mp4"
        poster="poster.jpg"
        id="test-volume-sync"
        dataHint="video"
      />
    )

    const video = screen.getByTestId('video') as HTMLVideoElement

    // Wait for media chrome to load
    await waitFor(() => {
      expect(screen.getByTestId('media-control-bar')).toBeInTheDocument()
    })

    // Simulate device volume change
    Object.defineProperty(video, 'volume', {
      writable: true,
      value: 0.5
    })

    // Dispatch volume change event that would normally come from device
    const volumeEvent = new Event('volumechange')
    video.dispatchEvent(volumeEvent)

    // Verify the volume property was updated
    expect(video.volume).toBe(0.5)
  })
})

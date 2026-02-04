import {render, screen} from '@/test-utils'
import Hls from 'hls.js'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useVideoPlayer} from './useVideoPlayer'

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

// Test component to properly test the hook
function TestVideoPlayer({
  src,
  type = 'mp4'
}: {
  src: string
  type?: 'hls' | 'mp4'
}) {
  const videoRef = useVideoPlayer({src, type})
  return (
    <video ref={videoRef} aria-label="Test Video">
      {type === 'mp4' && <source src={src} type="video/mp4" />}
      <track kind="captions" />
    </video>
  )
}

describe('useVideoPlayer', () => {
  const getMockInstance = () => (Hls as any).mockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    const mockInstance = getMockInstance()
    mockInstance.loadSource.mockClear()
    mockInstance.attachMedia.mockClear()
    mockInstance.destroy.mockClear()
    ;(Hls.isSupported as any).mockReturnValue(true)
  })

  describe('HLS streaming', () => {
    it('initializes HLS.js for HLS streams when supported', () => {
      const mockInstance = getMockInstance()

      render(<TestVideoPlayer src="https://v.redd.it/test.m3u8" type="hls" />)

      expect(Hls.isSupported).toHaveBeenCalled()
      expect(mockInstance.loadSource).toHaveBeenCalledWith(
        'https://v.redd.it/test.m3u8'
      )
      expect(mockInstance.attachMedia).toHaveBeenCalled()
    })

    it('does not initialize HLS for mp4 videos', () => {
      const mockInstance = getMockInstance()

      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)

      expect(mockInstance.loadSource).not.toHaveBeenCalled()
      expect(mockInstance.attachMedia).not.toHaveBeenCalled()
    })

    it('destroys HLS instance on unmount', () => {
      const mockInstance = getMockInstance()

      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.m3u8" type="hls" />
      )

      unmount()

      expect(mockInstance.destroy).toHaveBeenCalled()
    })

    it('does not destroy HLS instance for mp4 on unmount', () => {
      const mockInstance = getMockInstance()

      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )

      unmount()

      expect(mockInstance.destroy).not.toHaveBeenCalled()
    })
  })

  describe('IntersectionObserver', () => {
    it('observes video element on mount', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)

      expect(mockObserver.observe).toHaveBeenCalled()
    })

    it('unobserves video element on unmount', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )

      unmount()

      expect(mockObserver.unobserve).toHaveBeenCalled()
    })

    it('pauses video when scrolled out of view', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)

      const video = screen.getByLabelText('Test Video')
      const pauseSpy = vi.fn()

      Object.defineProperty(video, 'paused', {
        value: false,
        writable: true
      })
      Object.defineProperty(video, 'pause', {
        value: pauseSpy,
        writable: true
      })

      // Trigger intersection callback
      mockObserver.callback([{target: video}])

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('does not pause already paused video', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)

      const video = screen.getByLabelText('Test Video')
      const pauseSpy = vi.fn()

      Object.defineProperty(video, 'paused', {
        value: true,
        writable: true
      })
      Object.defineProperty(video, 'pause', {
        value: pauseSpy,
        writable: true
      })

      mockObserver.callback([{target: video}])

      expect(pauseSpy).not.toHaveBeenCalled()
    })

    it('disconnects shared observer when last video unmounts', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )

      unmount()

      expect(mockObserver.disconnect).toHaveBeenCalled()
    })
  })

  describe('auto-pause other videos', () => {
    it('pauses other videos when one starts playing', () => {
      render(
        <>
          <TestVideoPlayer src="https://v.redd.it/one.mp4" type="mp4" />
          <div data-testid="separator" />
          <TestVideoPlayer src="https://v.redd.it/two.mp4" type="mp4" />
        </>
      )

      const videos = screen.getAllByLabelText('Test Video')
      const firstVideo = videos[0]
      const secondVideo = videos[1]

      const pauseSpy = vi.fn()
      Object.defineProperty(secondVideo, 'paused', {
        value: false,
        writable: true
      })
      Object.defineProperty(secondVideo, 'pause', {
        value: pauseSpy,
        writable: true
      })

      // Trigger play event on first video
      firstVideo.dispatchEvent(new Event('play'))

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('does not pause already paused videos', () => {
      render(
        <>
          <TestVideoPlayer src="https://v.redd.it/one.mp4" type="mp4" />
          <TestVideoPlayer src="https://v.redd.it/two.mp4" type="mp4" />
        </>
      )

      const videos = screen.getAllByLabelText('Test Video')
      const firstVideo = videos[0]
      const secondVideo = videos[1]

      const pauseSpy = vi.fn()
      Object.defineProperty(secondVideo, 'paused', {
        value: true,
        writable: true
      })
      Object.defineProperty(secondVideo, 'pause', {
        value: pauseSpy,
        writable: true
      })

      firstVideo.dispatchEvent(new Event('play'))

      expect(pauseSpy).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )

      const video = screen.getByLabelText('Test Video')
      const removeEventListenerSpy = vi.spyOn(video, 'removeEventListener')

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      )
    })
  })
})

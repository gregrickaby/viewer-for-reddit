import {logger} from '@/lib/datadog/client'
import {render, screen} from '@/test-utils'
import videojs from 'video.js'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MAX_ACTIVE_PLAYERS, useVideoPlayer} from './useVideoPlayer'

vi.mock('@/lib/datadog/client', () => ({
  logger: {error: vi.fn()}
}))

vi.mock('video.js', () => {
  const createMockPlayer = () => {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    return {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        const list = handlers.get(event) ?? []
        list.push(cb)
        handlers.set(event, list)
      }),
      trigger: (event: string) => {
        handlers.get(event)?.forEach((cb) => cb())
      },
      pause: vi.fn(),
      paused: vi.fn(() => false),
      error: vi.fn(() => null),
      dispose: vi.fn(),
      isDisposed: vi.fn(() => false)
    }
  }

  const videojsMock: any = vi.fn(() => createMockPlayer())
  return {default: videojsMock}
})

// Each `new IntersectionObserver(...)` call in the hook (one for lazy
// attach, one for visibility/pause tracking) is captured here so tests can
// drive them independently by their distinguishing options.
interface MockObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}
const observerInstances: MockObserver[] = []

global.IntersectionObserver = class IntersectionObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(callback: IntersectionObserverCallback, options?: any) {
    this.callback = callback
    this.options = options
    observerInstances.push(this as unknown as MockObserver)
  }
} as any

// The hook's attach/visibility observers are module-level singletons (only
// created once, on first use), so grab whichever instance matches each
// role - `.at(-1)` picks the most recently created one, which is correct the
// first time each is created and stable afterward since they aren't recreated.
const getAttachObserver = () =>
  observerInstances.filter((o) => o.options?.rootMargin).at(-1)!
const getVisibilityObserver = () =>
  observerInstances.filter((o) => o.options?.threshold === 0.25).at(-1)!

function simulateAttach(container: Element) {
  getAttachObserver().callback(
    [{isIntersecting: true, target: container} as IntersectionObserverEntry],
    getAttachObserver() as unknown as IntersectionObserver
  )
}

function simulateVisibility(videoElement: Element, isIntersecting: boolean) {
  getVisibilityObserver().callback(
    [{isIntersecting, target: videoElement} as IntersectionObserverEntry],
    getVisibilityObserver() as unknown as IntersectionObserver
  )
}

// Test component to properly test the hook
function TestVideoPlayer({
  src,
  type = 'mp4',
  poster
}: {
  src: string
  type?: 'hls' | 'mp4'
  poster?: string
}) {
  const containerRef = useVideoPlayer({src, type, poster})
  return <div ref={containerRef} aria-label="Test Video" />
}

describe('useVideoPlayer', () => {
  const mockVideojs = vi.mocked(videojs)
  const mockLogger = vi.mocked(logger)

  const getLastPlayer = () =>
    mockVideojs.mock.results.at(-1)?.value as ReturnType<typeof mockVideojs> & {
      trigger: (event: string) => void
      pause: ReturnType<typeof vi.fn>
      paused: ReturnType<typeof vi.fn>
      error: ReturnType<typeof vi.fn>
      dispose: ReturnType<typeof vi.fn>
      isDisposed: ReturnType<typeof vi.fn>
    }

  const getVideoElement = () =>
    mockVideojs.mock.calls.at(-1)?.[0] as HTMLVideoElement

  beforeEach(() => {
    vi.clearAllMocks()
    observerInstances.length = 0
  })

  describe('lazy attach', () => {
    it('does not create a player until the container nears the viewport', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)

      expect(mockVideojs).not.toHaveBeenCalled()
    })

    it('observes the container for lazy attach on mount', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      const container = screen.getByLabelText('Test Video')

      expect(getAttachObserver().observe).toHaveBeenCalledWith(container)
    })

    it('creates the player once the container nears the viewport', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      const container = screen.getByLabelText('Test Video')

      simulateAttach(container)

      expect(mockVideojs).toHaveBeenCalledTimes(1)
    })

    it('shows a poster placeholder before attaching', () => {
      render(
        <TestVideoPlayer
          src="https://v.redd.it/test.mp4"
          type="mp4"
          poster="https://preview.redd.it/poster.jpg"
        />
      )
      const container = screen.getByLabelText('Test Video')
      const img = container.querySelector('img')

      expect(img).toHaveAttribute('src', 'https://preview.redd.it/poster.jpg')
    })

    it('removes the poster placeholder once attached', () => {
      render(
        <TestVideoPlayer
          src="https://v.redd.it/test.mp4"
          type="mp4"
          poster="https://preview.redd.it/poster.jpg"
        />
      )
      const container = screen.getByLabelText('Test Video')

      simulateAttach(container)

      expect(container.querySelector('img')).not.toBeInTheDocument()
    })

    it('does not render a poster placeholder when none is provided', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      const container = screen.getByLabelText('Test Video')

      expect(container.querySelector('img')).not.toBeInTheDocument()
    })

    it('unobserves the container for attach on unmount before it attaches', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )
      const observer = getAttachObserver()

      unmount()

      expect(observer.unobserve).toHaveBeenCalled()
      expect(mockVideojs).not.toHaveBeenCalled()
    })
  })

  describe('player initialization', () => {
    it('initializes video.js with an HLS source for hls type', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.m3u8" type="hls" />)
      simulateAttach(screen.getByLabelText('Test Video'))

      expect(mockVideojs).toHaveBeenCalledWith(
        expect.any(HTMLVideoElement),
        expect.objectContaining({
          sources: [
            {src: 'https://v.redd.it/test.m3u8', type: 'application/x-mpegURL'}
          ]
        })
      )
    })

    it('initializes video.js with an mp4 source for mp4 type', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      simulateAttach(screen.getByLabelText('Test Video'))

      expect(mockVideojs).toHaveBeenCalledWith(
        expect.any(HTMLVideoElement),
        expect.objectContaining({
          sources: [{src: 'https://v.redd.it/test.mp4', type: 'video/mp4'}]
        })
      )
    })

    it('passes the poster option through to video.js', () => {
      render(
        <TestVideoPlayer
          src="https://v.redd.it/test.mp4"
          type="mp4"
          poster="https://preview.redd.it/poster.jpg"
        />
      )
      simulateAttach(screen.getByLabelText('Test Video'))

      expect(mockVideojs).toHaveBeenCalledWith(
        expect.any(HTMLVideoElement),
        expect.objectContaining({poster: 'https://preview.redd.it/poster.jpg'})
      )
    })

    it('disposes the player on unmount', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()

      unmount()

      expect(player.dispose).toHaveBeenCalled()
    })

    it('does not dispose an already-disposed player', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()
      player.isDisposed.mockReturnValue(true)

      unmount()

      expect(player.dispose).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('logs playback errors to Datadog', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.m3u8" type="hls" />)
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()
      player.error.mockReturnValue({code: 2, message: 'network error'})

      player.trigger('error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Video playback error',
        expect.objectContaining({
          src: 'https://v.redd.it/test.m3u8',
          type: 'hls',
          code: 2,
          message: 'network error'
        })
      )
    })
  })

  describe('visibility (pause-on-scroll-away)', () => {
    it('observes the created video element once attached', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      simulateAttach(screen.getByLabelText('Test Video'))

      expect(getVisibilityObserver().observe).toHaveBeenCalledWith(
        getVideoElement()
      )
    })

    it('pauses the player when scrolled out of view', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()
      player.paused.mockReturnValue(false)

      simulateVisibility(getVideoElement(), false)

      expect(player.pause).toHaveBeenCalled()
    })

    it('does not pause an already-paused player', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()
      player.paused.mockReturnValue(true)

      simulateVisibility(getVideoElement(), false)

      expect(player.pause).not.toHaveBeenCalled()
    })

    it('does not pause when scrolling into view', () => {
      render(<TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />)
      simulateAttach(screen.getByLabelText('Test Video'))
      const player = getLastPlayer()
      player.paused.mockReturnValue(false)

      simulateVisibility(getVideoElement(), true)

      expect(player.pause).not.toHaveBeenCalled()
    })

    it('unobserves the video element on unmount', () => {
      const {unmount} = render(
        <TestVideoPlayer src="https://v.redd.it/test.mp4" type="mp4" />
      )
      simulateAttach(screen.getByLabelText('Test Video'))
      const observer = getVisibilityObserver()

      unmount()

      expect(observer.unobserve).toHaveBeenCalled()
    })
  })

  describe('auto-pause other videos', () => {
    it('pauses other players when one starts playing', () => {
      render(
        <>
          <TestVideoPlayer src="https://v.redd.it/one.mp4" type="mp4" />
          <TestVideoPlayer src="https://v.redd.it/two.mp4" type="mp4" />
        </>
      )
      const [firstContainer, secondContainer] =
        screen.getAllByLabelText('Test Video')
      simulateAttach(firstContainer)
      simulateAttach(secondContainer)

      const players = mockVideojs.mock.results.map((r) => r.value)
      const [firstPlayer, secondPlayer] = players
      secondPlayer.paused.mockReturnValue(false)

      firstPlayer.trigger('play')

      expect(secondPlayer.pause).toHaveBeenCalled()
      expect(firstPlayer.pause).not.toHaveBeenCalled()
    })

    it('does not pause already-paused players', () => {
      render(
        <>
          <TestVideoPlayer src="https://v.redd.it/one.mp4" type="mp4" />
          <TestVideoPlayer src="https://v.redd.it/two.mp4" type="mp4" />
        </>
      )
      const [firstContainer, secondContainer] =
        screen.getAllByLabelText('Test Video')
      simulateAttach(firstContainer)
      simulateAttach(secondContainer)

      const players = mockVideojs.mock.results.map((r) => r.value)
      const [firstPlayer, secondPlayer] = players
      secondPlayer.paused.mockReturnValue(true)

      firstPlayer.trigger('play')

      expect(secondPlayer.pause).not.toHaveBeenCalled()
    })
  })

  describe('active player cap (eviction)', () => {
    it('evicts the oldest off-screen player once the cap is exceeded', () => {
      const count = MAX_ACTIVE_PLAYERS + 1
      render(
        <>
          {Array.from({length: count}, (_, i) => (
            <TestVideoPlayer key={i} src={`https://v.redd.it/${i}.mp4`} />
          ))}
        </>
      )
      const containers = screen.getAllByLabelText('Test Video')
      containers.forEach(simulateAttach)

      const players = mockVideojs.mock.results.map((r) => r.value)

      // Every attached player defaults to visible:false until the
      // visibility observer says otherwise, so the oldest (first attached)
      // is the eviction candidate once the (MAX_ACTIVE_PLAYERS + 1)th
      // attach pushes the registry over the cap.
      expect(players[0].dispose).toHaveBeenCalled()
      expect(players.at(-1)!.dispose).not.toHaveBeenCalled()
    })

    it('does not evict a currently-visible player', () => {
      const count = MAX_ACTIVE_PLAYERS + 1
      render(
        <>
          {Array.from({length: count}, (_, i) => (
            <TestVideoPlayer key={i} src={`https://v.redd.it/${i}.mp4`} />
          ))}
        </>
      )
      const containers = screen.getAllByLabelText('Test Video')

      // Attach and mark every player visible before the last one attaches,
      // so there is no safe eviction candidate for it.
      containers.slice(0, MAX_ACTIVE_PLAYERS).forEach((container) => {
        simulateAttach(container)
        simulateVisibility(getVideoElement(), true)
      })
      simulateAttach(containers[MAX_ACTIVE_PLAYERS])

      const players = mockVideojs.mock.results.map((r) => r.value)

      players.slice(0, MAX_ACTIVE_PLAYERS).forEach((player) => {
        expect(player.dispose).not.toHaveBeenCalled()
      })
      expect(mockVideojs).toHaveBeenCalledTimes(count)
    })

    it('re-attaches an evicted player when scrolled back into view', () => {
      const count = MAX_ACTIVE_PLAYERS + 1
      render(
        <>
          {Array.from({length: count}, (_, i) => (
            <TestVideoPlayer key={i} src={`https://v.redd.it/${i}.mp4`} />
          ))}
        </>
      )
      const containers = screen.getAllByLabelText('Test Video')
      containers.forEach(simulateAttach)

      // The first container's player was evicted - scrolling back near it
      // should recreate a player for the same container.
      expect(mockVideojs).toHaveBeenCalledTimes(count)
      simulateAttach(containers[0])

      expect(mockVideojs).toHaveBeenCalledTimes(count + 1)
    })
  })
})

// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* A controllable IntersectionObserver: tests decide what is in view. */
type Observer = {
  callback: IntersectionObserverCallback
  options: IntersectionObserverInit | undefined
  targets: Set<Element>
}
const observers: Observer[] = []
class FakeObserver {
  observer: Observer
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.observer = { callback, options, targets: new Set() }
    observers.push(this.observer)
  }
  observe(target: Element) {
    this.observer.targets.add(target)
  }
  unobserve(target: Element) {
    this.observer.targets.delete(target)
  }
  disconnect() {
    this.observer.targets.clear()
  }
}

/** Reports `target` to every observer: near the viewport, and whether it is visible. */
function show(
  target: Element,
  { near = true, ratio = 1 }: { near?: boolean; ratio?: number } = {},
) {
  for (const observer of observers) {
    if (!observer.targets.has(target)) continue
    const attach = observer.options?.rootMargin !== undefined
    const entry = {
      target,
      isIntersecting: attach ? near : ratio > 0,
      intersectionRatio: attach ? 1 : ratio,
    }
    act(() => observer.callback([entry as IntersectionObserverEntry], {} as IntersectionObserver))
  }
}

const hlsInstances: Array<{
  handlers: Record<string, (event: string, data: { fatal: boolean; details: string }) => void>
  destroy: ReturnType<typeof vi.fn>
  loadSource: ReturnType<typeof vi.fn>
  attachMedia: ReturnType<typeof vi.fn>
}> = []
const hlsState = { supported: true }
vi.mock('hls.js', () => {
  class Hls {
    static isSupported = () => hlsState.supported
    static Events = { ERROR: 'hlsError' }
    handlers: Record<string, (event: string, data: { fatal: boolean; details: string }) => void> =
      {}
    destroy = vi.fn()
    loadSource = vi.fn()
    attachMedia = vi.fn()
    constructor() {
      hlsInstances.push(this)
    }
    on(event: string, handler: (event: string, data: { fatal: boolean; details: string }) => void) {
      this.handlers[event] = handler
    }
  }
  return { default: Hls }
})

let reducedMotion = false
beforeEach(() => {
  hlsInstances.length = 0
  hlsState.supported = true
  reducedMotion = false
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { value: false, configurable: true })
    this.dispatchEvent(new Event('play'))
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { value: true, configurable: true })
    this.dispatchEvent(new Event('pause'))
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const { AutoplayVideo } = await import('@/components/islands/autoplay-video')
const { RedditVideo } = await import('@/components/islands/reddit-video')
const { EmbedFacade } = await import('@/components/islands/embed-facade')
const { MAX_ATTACHED, claimAudio, registerPlayer } =
  await import('@/components/islands/player-registry')

const loop = {
  mp4: 'https://i.redd.it/a.mp4',
  width: 480,
  height: 270,
  poster: 'https://i.redd.it/a.jpg',
  label: 'A loop',
}

describe('AutoplayVideo', () => {
  it('loads near the viewport, plays while visible, and pauses when not', () => {
    const { container } = render(<AutoplayVideo {...loop} />)
    const frame = container.firstElementChild!
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toBeNull()

    show(frame, { ratio: 1 })
    expect(video.getAttribute('src')).toBe(loop.mp4)
    expect(video.play).toHaveBeenCalled()
    show(frame, { ratio: 0.2 })
    expect(video.pause).toHaveBeenCalled()
  })

  it('waits for a press under reduced motion', () => {
    reducedMotion = true
    const { container } = render(<AutoplayVideo {...loop} poster={null} />)
    show(container.firstElementChild!, { ratio: 1 })
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    const button = screen.getByRole('button', { name: '▶ Play' })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Pause' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeTruthy()
  })

  it('releases the decoder on unmount', () => {
    const { container, unmount } = render(<AutoplayVideo {...loop} />)
    show(container.firstElementChild!)
    const video = container.querySelector('video')!
    unmount()
    expect(video.getAttribute('src')).toBeNull()
    expect(video.load).toHaveBeenCalled()
  })
})

const stream = {
  hls: 'https://v.redd.it/x/HLSPlaylist.m3u8',
  mp4Fallback: 'https://v.redd.it/x/DASH_720.mp4',
  width: 1280,
  height: 720,
  poster: 'https://preview.redd.it/x.jpg',
  label: 'A video',
}

describe('RedditVideo', () => {
  it('shows the poster, then attaches hls.js near the viewport', async () => {
    const { container } = render(<RedditVideo {...stream} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(stream.poster)
    expect(container.querySelector('video[controls]:not(noscript *)')).toBeNull()

    show(container.firstElementChild!)
    await vi.waitFor(() => expect(hlsInstances).toHaveLength(1))
    expect(hlsInstances[0]!.loadSource).toHaveBeenCalledWith(stream.hls)
    expect(hlsInstances[0]!.attachMedia).toHaveBeenCalled()
  })

  it('falls back to the silent MP4 with a note when HLS fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<RedditVideo {...stream} />)
    show(container.firstElementChild!)
    await vi.waitFor(() => expect(hlsInstances).toHaveLength(1))
    act(() => hlsInstances[0]!.handlers.hlsError!('hlsError', { fatal: false, details: 'minor' }))
    expect(screen.queryByText('No audio')).toBeNull()
    act(() =>
      hlsInstances[0]!.handlers.hlsError!('hlsError', {
        fatal: true,
        details: 'manifestLoadError',
      }),
    )
    expect(hlsInstances[0]!.destroy).toHaveBeenCalled()
    expect(container.querySelector('video')?.getAttribute('src')).toBe(stream.mp4Fallback)
    expect(screen.getByText('No audio')).toBeTruthy()
  })

  it('uses native HLS only without Media Source Extensions, and falls back if that fails', async () => {
    hlsState.supported = false
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe')
    const { container } = render(<RedditVideo {...stream} poster={null} />)
    show(container.firstElementChild!)
    await vi.waitFor(() =>
      expect(container.querySelector('video')?.getAttribute('src')).toBe(stream.hls),
    )
    act(() => {
      container.querySelector('video')!.dispatchEvent(new Event('error'))
    })
    expect(container.querySelector('video')?.getAttribute('src')).toBe(stream.mp4Fallback)
  })

  it('keeps the element empty when nothing can play it and there is no MP4', async () => {
    hlsState.supported = false
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('')
    const { container } = render(<RedditVideo {...stream} mp4Fallback={null} />)
    show(container.firstElementChild!)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    expect(screen.queryByText('No audio')).toBeNull()
  })

  it('pauses other audible videos when one starts, and cleans up on unmount', async () => {
    const first = render(<RedditVideo {...stream} />)
    const second = render(<RedditVideo {...stream} />)
    // One at a time: two concurrent dynamic imports of a mocked module race in Vitest.
    show(first.container.firstElementChild!)
    await vi.waitFor(() => expect(hlsInstances).toHaveLength(1))
    show(second.container.firstElementChild!)
    await vi.waitFor(() => expect(hlsInstances).toHaveLength(2))
    const [a, b] = [
      first.container.querySelector('video')!,
      second.container.querySelector('video')!,
    ]
    const pause = vi.spyOn(a, 'pause')
    fireEvent.play(b)
    expect(pause).toHaveBeenCalled()
    first.unmount()
    expect(hlsInstances[0]!.destroy).toHaveBeenCalled()
  })
})

describe('player registry', () => {
  it(`keeps at most ${MAX_ATTACHED} players attached, evicting the one seen longest ago`, () => {
    const detached: number[] = []
    const elements = Array.from({ length: MAX_ATTACHED + 1 }, () => document.createElement('div'))
    const cleanups = elements.map((element, index) =>
      registerPlayer(element, { attach: () => {}, detach: () => detached.push(index) }),
    )
    elements.slice(0, MAX_ATTACHED).forEach((element) => show(element, { ratio: 0 }))
    show(elements[MAX_ATTACHED]!)
    expect(detached).toEqual([0])
    cleanups.forEach((cleanup) => cleanup())
  })

  it('waits when every attached player is on screen', () => {
    const attached: number[] = []
    const elements = Array.from({ length: MAX_ATTACHED + 1 }, () => document.createElement('div'))
    const cleanups = elements.map((element, index) =>
      registerPlayer(element, { attach: () => attached.push(index), detach: () => {} }),
    )
    elements.slice(0, MAX_ATTACHED).forEach((element) => show(element))
    show(elements[MAX_ATTACHED]!)
    expect(attached).not.toContain(MAX_ATTACHED)
    // Players without an attach step, and repeat reports, are ignored.
    const passive = document.createElement('div')
    const done = registerPlayer(passive, {})
    show(passive)
    show(elements[0]!)
    done()
    cleanups.forEach((cleanup) => cleanup())
  })

  it('asks only other audible players to pause', () => {
    const [a, b] = [document.createElement('div'), document.createElement('div')]
    const yieldA = vi.fn()
    const cleanups = [registerPlayer(a, { yieldAudio: yieldA }), registerPlayer(b, {})]
    claimAudio(b)
    expect(yieldA).toHaveBeenCalledOnce()
    claimAudio(a)
    expect(yieldA).toHaveBeenCalledOnce()
    cleanups.forEach((cleanup) => cleanup())
  })

  it('ignores reports for elements it no longer tracks', () => {
    const element = document.createElement('div')
    const cleanup = registerPlayer(element, { visibility: vi.fn() })
    const [attach, visibility] = observers.slice(-2)
    cleanup()
    const entry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 1,
    } as unknown as IntersectionObserverEntry
    expect(() => {
      attach!.callback([entry], {} as IntersectionObserver)
      visibility!.callback([entry], {} as IntersectionObserver)
    }).not.toThrow()
  })
})

const embed = {
  provider: 'youtube',
  providerName: 'YouTube',
  title: 'A video',
  iframeSrc: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
  aspectRatio: 16 / 9,
  height: null,
  allow: 'autoplay',
  sandbox: 'allow-scripts allow-same-origin',
  originalUrl: 'https://youtu.be/dQw4w9WgXcQ',
  poster: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
}

describe('EmbedFacade', () => {
  it('is a link to the original until pressed, then loads the player', () => {
    const { container } = render(<EmbedFacade {...embed} />)
    expect(container.querySelector('iframe')).toBeNull()
    const link = screen.getByRole('link', { name: 'Play A video (YouTube)' })
    expect(link.getAttribute('href')).toBe(embed.originalUrl)
    fireEvent.click(link)
    const iframe = container.querySelector('iframe')!
    expect(iframe.getAttribute('src')).toBe(embed.iframeSrc)
    expect(iframe.getAttribute('sandbox')).toBe(embed.sandbox)
    expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
    expect(document.activeElement).toBe(iframe)
  })

  it('lets modified clicks open the original, and sizes audio players by height', () => {
    const { container } = render(<EmbedFacade {...embed} poster={null} height={152} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('style')).toContain('block-size: 152px')
    fireEvent.click(link, { metaKey: true })
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
})

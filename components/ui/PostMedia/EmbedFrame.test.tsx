import {act, render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {EmbedFrame} from './EmbedFrame'

let mockPathname = '/r/aww'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname
}))

interface MockObserver {
  callback: IntersectionObserverCallback
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}
let observerInstances: MockObserver[] = []

class FakeIntersectionObserver {
  callback: IntersectionObserverCallback
  observe = (_target: Element) => {}
  unobserve = (_target: Element) => {}
  disconnect = () => {}

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    observerInstances.push(this as unknown as MockObserver)
  }
}
global.IntersectionObserver = FakeIntersectionObserver as any

function simulateIntersection(target: Element, isIntersecting: boolean) {
  act(() => {
    observerInstances
      .at(-1)!
      .callback(
        [{isIntersecting, target} as IntersectionObserverEntry],
        observerInstances.at(-1)! as unknown as IntersectionObserver
      )
  })
}

describe('EmbedFrame', () => {
  beforeEach(() => {
    observerInstances = []
    mockPathname = '/r/aww'
  })

  it('renders the iframe with the given src and title', () => {
    render(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )

    const iframe = screen.getByTitle('Test Post')
    expect(iframe).toHaveAttribute('src', 'https://www.redgifs.com/ifr/abc')
  })

  it('removes the iframe when scrolled out of view', () => {
    render(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )
    const container = screen.getByTitle('Test Post').parentElement!

    simulateIntersection(container, false)

    expect(screen.queryByTitle('Test Post')).not.toBeInTheDocument()
  })

  it('restores the iframe when it re-enters the viewport', () => {
    render(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )
    const container = screen.getByTitle('Test Post').parentElement!

    simulateIntersection(container, false)
    expect(screen.queryByTitle('Test Post')).not.toBeInTheDocument()

    simulateIntersection(container, true)

    expect(screen.getByTitle('Test Post')).toBeInTheDocument()
  })

  it('removes the iframe when the route changes, even while still mounted', () => {
    const {rerender} = render(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )
    expect(screen.getByTitle('Test Post')).toBeInTheDocument()

    mockPathname = '/r/cats'
    rerender(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )

    expect(screen.queryByTitle('Test Post')).not.toBeInTheDocument()
  })

  it('stays removed after a route change even if it scrolls back into view', () => {
    const {rerender} = render(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )
    const container = screen.getByTitle('Test Post').parentElement!

    mockPathname = '/r/cats'
    rerender(
      <EmbedFrame src="https://www.redgifs.com/ifr/abc" title="Test Post" />
    )
    expect(screen.queryByTitle('Test Post')).not.toBeInTheDocument()

    simulateIntersection(container, true)

    expect(screen.queryByTitle('Test Post')).not.toBeInTheDocument()
  })
})

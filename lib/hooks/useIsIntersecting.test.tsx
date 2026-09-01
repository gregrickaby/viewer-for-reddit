import {act, render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it} from 'vitest'
import {useIsIntersecting} from './useIsIntersecting'

interface MockObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}
let observerInstances: MockObserver[] = []

class FakeIntersectionObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  observe = (_target: Element) => {}
  unobserve = (_target: Element) => {}
  disconnect = () => {}

  constructor(callback: IntersectionObserverCallback, options?: any) {
    this.callback = callback
    this.options = options
    observerInstances.push(this as unknown as MockObserver)
  }
}
global.IntersectionObserver = FakeIntersectionObserver as any

function getObserver() {
  return observerInstances.at(-1)!
}

function simulateIntersection(target: Element, isIntersecting: boolean) {
  act(() => {
    getObserver().callback(
      [{isIntersecting, target} as IntersectionObserverEntry],
      getObserver() as unknown as IntersectionObserver
    )
  })
}

function TestComponent() {
  const [ref, isIntersecting] = useIsIntersecting<HTMLDivElement>()
  return (
    <div ref={ref} data-testid="target">
      {isIntersecting ? 'visible' : 'hidden'}
    </div>
  )
}

describe('useIsIntersecting', () => {
  beforeEach(() => {
    observerInstances = []
  })

  it('starts as intersecting/visible', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('target')).toHaveTextContent('visible')
  })

  it('updates to hidden when the element leaves the viewport', () => {
    render(<TestComponent />)
    const target = screen.getByTestId('target')

    simulateIntersection(target, false)

    expect(screen.getByTestId('target')).toHaveTextContent('hidden')
  })

  it('updates back to visible when the element re-enters the viewport', () => {
    render(<TestComponent />)
    const target = screen.getByTestId('target')

    simulateIntersection(target, false)
    simulateIntersection(target, true)

    expect(screen.getByTestId('target')).toHaveTextContent('visible')
  })

  it('observes with a 0.25 threshold', () => {
    render(<TestComponent />)
    expect(getObserver().options?.threshold).toBe(0.25)
  })

  it('shares a single observer instance across multiple mounted components', () => {
    render(<TestComponent />)
    const firstCount = observerInstances.length

    render(<TestComponent />)

    expect(observerInstances.length).toBe(firstCount)
  })
})

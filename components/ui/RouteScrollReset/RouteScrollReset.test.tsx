import {render} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import RouteScrollReset from './RouteScrollReset'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}))

describe('RouteScrollReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/')

    globalThis.history.replaceState({}, '', '/')
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined)
  })

  it('scrolls to top on mount', () => {
    render(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto'
    })
  })

  it('scrolls to top when pathname changes', () => {
    const {rerender} = render(<RouteScrollReset />)

    mockUsePathname.mockReturnValue('/r/javascript')
    rerender(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(2)
  })

  it('does not scroll again when pathname is unchanged', () => {
    const {rerender} = render(<RouteScrollReset />)

    rerender(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(1)
  })
})

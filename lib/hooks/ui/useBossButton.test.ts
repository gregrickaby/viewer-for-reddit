import {renderHook} from '@/test-utils/renderHook'
import {useBossButton} from './useBossButton'

const {pushMock, useRouterMock, scrollYRef} = vi.hoisted(() => {
  return {
    pushMock: vi.fn(),
    useRouterMock: () => ({push: pushMock}),
    scrollYRef: {y: 0}
  }
})

vi.mock('next/navigation', () => ({useRouter: useRouterMock}))
vi.mock('@mantine/hooks', () => ({
  useWindowScroll: () => [scrollYRef]
}))

describe('useBossButton', () => {
  const redirectUrl = 'https://duckduckgo.com'

  beforeEach(() => {
    pushMock.mockClear()
    scrollYRef.y = 0
  })

  it('returns correct buttonText and redirectUrl', () => {
    const {result} = renderHook(() => useBossButton(redirectUrl))
    expect(result.current.buttonText).toContain('boss button')
    expect(result.current.redirectUrl).toBe(redirectUrl)
  })

  it('shouldShow is false when scroll.y <= 200', () => {
    scrollYRef.y = 100
    const {result} = renderHook(() => useBossButton(redirectUrl))
    expect(result.current.shouldShow).toBe(false)
  })

  it('shouldShow is true when scroll.y > 200', () => {
    scrollYRef.y = 201
    const {result} = renderHook(() => useBossButton(redirectUrl))
    expect(result.current.shouldShow).toBe(true)
  })

  it('calls router.push on Escape keydown', () => {
    renderHook(() => useBossButton(redirectUrl))
    const event = new KeyboardEvent('keydown', {key: 'Escape'})
    window.dispatchEvent(event)
    expect(pushMock).toHaveBeenCalledWith(redirectUrl)
  })

  it('does not call router.push on other keydown', () => {
    renderHook(() => useBossButton(redirectUrl))
    const event = new KeyboardEvent('keydown', {key: 'Enter'})
    window.dispatchEvent(event)
    expect(pushMock).not.toHaveBeenCalled()
  })
})

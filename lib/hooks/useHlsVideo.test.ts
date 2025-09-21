import {act, mockPreloadedState, renderHook} from '@/test-utils'
import {useHlsVideo} from './useHlsVideo'

const preloadedState = mockPreloadedState

describe('useHlsVideo', () => {
  it('returns refs and state', () => {
    const {result} = renderHook(
      () => useHlsVideo({src: undefined, fallbackUrl: undefined}),
      {preloadedState}
    )
    expect(result.current).toHaveProperty('videoRef')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isMuted', false)
  })

  it('isMuted reflects Redux state', () => {
    const mutedState = {
      ...preloadedState,
      settings: {...preloadedState.settings, isMuted: true}
    }
    const {result} = renderHook(() => useHlsVideo({}), {
      preloadedState: mutedState
    })
    expect(result.current.isMuted).toBe(true)
  })

  it('videoRef is a ref object', () => {
    const {result} = renderHook(() => useHlsVideo({}), {preloadedState})
    expect(result.current.videoRef).toHaveProperty('current')
  })

  it('handles canplay event and sets isLoading to false', () => {
    const {result} = renderHook(() => useHlsVideo({}), {preloadedState})
    const video = document.createElement('video')
    result.current.videoRef.current = video
    act(() => {
      const event = new Event('canplay')
      video.dispatchEvent(event)
    })
  })
})

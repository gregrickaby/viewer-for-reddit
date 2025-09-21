import {act, mockPreloadedState, renderHook, server} from '@/test-utils'
import {http, HttpResponse} from 'msw'
import {useToggleFavorite} from './useToggleFavorite'

const preloadedState = {
  ...mockPreloadedState,
  settings: {
    ...mockPreloadedState.settings,
    favorites: [
      {
        display_name: 'reactjs',
        icon_img: '',
        over18: false,
        public_description: 'React community',
        subscribers: 100000,
        value: 'r/reactjs'
      }
    ]
  }
}

describe('useToggleFavorite', () => {
  it('should indicate favorite status from Redux', () => {
    const {result} = renderHook(() => useToggleFavorite('reactjs'), {
      preloadedState
    })
    expect(result.current.isFavorite).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('should indicate not favorite if not in favorites', () => {
    const {result} = renderHook(() => useToggleFavorite('aww'), {
      preloadedState
    })
    expect(result.current.isFavorite).toBe(false)
  })

  it('should add subreddit to favorites on toggle (success path)', async () => {
    server.use(
      http.get('https://oauth.reddit.com/r/aww/about.json', () =>
        HttpResponse.json({
          data: {
            display_name: 'aww',
            icon_img: '',
            over18: false,
            public_description: 'Cute stuff',
            subscribers: 123,
            value: 'r/aww'
          }
        })
      )
    )
    const {result} = renderHook(() => useToggleFavorite('aww'), {
      preloadedState
    })
    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.isFavorite).toBe(true)
  })

  it('should remove subreddit from favorites on toggle (success path)', async () => {
    server.use(
      http.get('https://oauth.reddit.com/r/reactjs/about.json', () =>
        HttpResponse.json({
          data: {
            display_name: 'reactjs',
            icon_img: '',
            over18: false,
            public_description: 'React community',
            subscribers: 100000,
            value: 'r/reactjs'
          }
        })
      )
    )
    const {result} = renderHook(() => useToggleFavorite('reactjs'), {
      preloadedState
    })
    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.isFavorite).toBe(false)
  })

  it('should handle API error gracefully', async () => {
    server.use(
      http.get('https://oauth.reddit.com/r/aww/about.json', () =>
        HttpResponse.text('fail', {status: 500})
      )
    )
    const {result} = renderHook(() => useToggleFavorite('aww'), {
      preloadedState
    })
    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.isFavorite).toBe(false)
  })

  it('should not trigger toggle if already loading', async () => {
    const {result} = renderHook(() => useToggleFavorite('aww'), {
      preloadedState
    })
    await act(async () => {
      result.current.toggle()
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
  })
})

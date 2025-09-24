import {act, mockPreloadedState, renderHook, server} from '@/test-utils'
import {http, HttpResponse} from 'msw'
import {useAddFavorite} from './useAddFavorite'

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

describe('useAddFavorite', () => {
  it('should indicate favorite status from Redux', () => {
    const {result} = renderHook(() => useAddFavorite('reactjs'), {
      preloadedState
    })
    expect(result.current.isFavorite).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('should indicate not favorite if not in favorites', () => {
    const {result} = renderHook(() => useAddFavorite('aww'), {
      preloadedState
    })
    expect(result.current.isFavorite).toBe(false)
  })

  it('should add subreddit to favorites on toggle (success path)', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')
        if (path === '/r/aww/about.json') {
          return HttpResponse.json({
            data: {
              display_name: 'aww',
              icon_img: '',
              over18: false,
              public_description: 'Cute stuff',
              subscribers: 123
            }
          })
        }
        return new HttpResponse(null, {status: 404})
      })
    )
    const {result} = renderHook(() => useAddFavorite('aww'), {
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
      http.get('http://localhost:3000/api/reddit', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')
        if (path === '/r/reactjs/about.json') {
          return HttpResponse.json({
            data: {
              display_name: 'reactjs',
              icon_img: '',
              over18: false,
              public_description: 'React community',
              subscribers: 100000
            }
          })
        }
        return new HttpResponse(null, {status: 404})
      })
    )
    const {result} = renderHook(() => useAddFavorite('reactjs'), {
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
      http.get('http://localhost:3000/api/reddit', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')
        if (path === '/r/aww/about.json') {
          return new HttpResponse(null, {status: 500})
        }
        return new HttpResponse(null, {status: 404})
      })
    )
    const {result} = renderHook(() => useAddFavorite('aww'), {
      preloadedState
    })
    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.isFavorite).toBe(false)
  })

  it('should not trigger toggle if already loading', async () => {
    const {result} = renderHook(() => useAddFavorite('aww'), {
      preloadedState
    })
    await act(async () => {
      result.current.toggle()
      await result.current.toggle()
    })
    expect(result.current.loading).toBe(false)
  })
})

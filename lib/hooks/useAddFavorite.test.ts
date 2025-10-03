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

const authenticatedState = {
  ...preloadedState,
  auth: {
    isAuthenticated: true,
    username: 'testuser',
    expiresAt: Date.now() + 3600000
  }
}

describe('useAddFavorite', () => {
  describe('Read-only mode', () => {
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

  describe('Authenticated mode', () => {
    it('should subscribe to subreddit when authenticated', async () => {
      server.use(
        http.post(
          'http://localhost:3000/api/reddit/subscribe',
          async ({request}) => {
            const body = (await request.json()) as {
              action: string
              sr_name: string
            }
            expect(body.action).toBe('sub')
            expect(body.sr_name).toBe('technology')
            return HttpResponse.json({
              success: true,
              action: 'sub',
              sr_name: 'technology'
            })
          }
        )
      )

      const {result} = renderHook(() => useAddFavorite('technology'), {
        preloadedState: authenticatedState
      })

      await act(async () => {
        await result.current.toggle()
      })

      expect(result.current.loading).toBe(false)
    })

    it('should unsubscribe from subreddit when authenticated', async () => {
      const authenticatedWithFavorite = {
        ...authenticatedState,
        settings: {
          ...authenticatedState.settings,
          favorites: [
            {
              display_name: 'technology',
              icon_img: '',
              over18: false,
              public_description: 'Tech news',
              subscribers: 500000,
              value: 'r/technology'
            }
          ]
        }
      }

      server.use(
        http.post(
          'http://localhost:3000/api/reddit/subscribe',
          async ({request}) => {
            const body = (await request.json()) as {
              action: string
              sr_name: string
            }
            expect(body.action).toBe('unsub')
            expect(body.sr_name).toBe('technology')
            return HttpResponse.json({
              success: true,
              action: 'unsub',
              sr_name: 'technology'
            })
          }
        )
      )

      const {result} = renderHook(() => useAddFavorite('technology'), {
        preloadedState: authenticatedWithFavorite
      })

      await act(async () => {
        await result.current.toggle()
      })

      expect(result.current.loading).toBe(false)
    })

    it('should handle subscription API errors gracefully', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/subscribe', () => {
          return HttpResponse.json(
            {error: 'Failed to update subscription'},
            {status: 500}
          )
        })
      )

      const {result} = renderHook(() => useAddFavorite('technology'), {
        preloadedState: authenticatedState
      })

      await act(async () => {
        await result.current.toggle()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.isFavorite).toBe(false)
    })

    it('should handle network errors when subscribing', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/subscribe', () => {
          return HttpResponse.error()
        })
      )

      const {result} = renderHook(() => useAddFavorite('technology'), {
        preloadedState: authenticatedState
      })

      await act(async () => {
        await result.current.toggle()
      })

      expect(result.current.loading).toBe(false)
    })
  })
})

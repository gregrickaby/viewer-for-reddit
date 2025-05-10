import {useSearchSubredditsQuery} from '@/lib/store/services/privateApi'
import {renderHook, server, waitFor} from '@/test-utils'
import {http, HttpResponse} from 'msw'

describe('privateApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('searchSubreddits', () => {
    it('should return search results', async () => {
      const query = 'itookapicture'

      const {result} = renderHook(() =>
        useSearchSubredditsQuery({
          query,
          enableNsfw: false
        })
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.length).toBeGreaterThan(0)
      expect(result.current.data?.[0]).toHaveProperty('display_name')
    })

    it('should handle empty search results', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2',
          () => {
            return HttpResponse.json({data: {children: []}})
          }
        )
      )

      const {result} = renderHook(() =>
        useSearchSubredditsQuery({
          query: 'nonexistentsubreddit12345',
          enableNsfw: false
        })
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.length).toBe(0)
    })

    it('should handle error response', async () => {
      server.use(
        http.get(
          'https://oauth.reddit.com/api/subreddit_autocomplete_v2',
          () => {
            return HttpResponse.error()
          }
        )
      )

      const {result} = renderHook(() =>
        useSearchSubredditsQuery({
          query: 'test',
          enableNsfw: false
        })
      )

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeDefined()
    })

    it('should include NSFW results when enabled', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({
          query: 'test',
          enableNsfw: true
        })
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})

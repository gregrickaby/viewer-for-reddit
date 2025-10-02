import {renderHook, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {useVoteMutation} from './voteApi'

describe('voteApi', () => {
  describe('useVoteMutation', () => {
    it('should successfully upvote a post', async () => {
      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({success: true})
    })

    it('should successfully downvote a post', async () => {
      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: -1})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({success: true})
    })

    it('should successfully remove vote from a post', async () => {
      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: 0})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({success: true})
    })

    it('should successfully vote on a comment', async () => {
      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't1_def456', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({success: true})
    })

    it('should handle missing id parameter', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.json(
            {error: 'Missing required parameters'},
            {status: 400}
          )
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: '', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })

    it('should handle missing dir parameter', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.json(
            {error: 'Missing required parameters'},
            {status: 400}
          )
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: undefined as any})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })

    it('should handle invalid dir parameter', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.json(
            {error: 'Invalid dir parameter'},
            {status: 400}
          )
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: 99 as any})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })

    it('should handle invalid id format', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.json({error: 'Invalid id format'}, {status: 400})
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 'invalid_id', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })

    it('should handle network errors', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.error()
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })

    it('should handle server errors', async () => {
      server.use(
        http.post('http://localhost:3000/api/reddit/vote', () => {
          return HttpResponse.json(
            {error: 'Internal server error'},
            {status: 500}
          )
        })
      )

      const {result} = renderHook(() => useVoteMutation())
      const [voteMutation] = result.current

      voteMutation({id: 't3_abc123', dir: 1})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })
    })
  })
})

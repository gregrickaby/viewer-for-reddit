import type {SaveRequest} from '@/lib/types'
import {renderHook, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {useSaveMutation} from './saveApi'

describe('saveApi', () => {
  describe('useSaveMutation', () => {
    it('should successfully save a post', async () => {
      const {result} = renderHook(() => useSaveMutation())
      const [saveMutation] = result.current

      saveMutation({id: 't3_abc123', save: true})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({
        success: true,
        id: 't3_abc123',
        saved: true
      })
    })

    it('should successfully unsave a post', async () => {
      const {result} = renderHook(() => useSaveMutation())
      const [saveMutation] = result.current

      saveMutation({id: 't3_abc123', save: false})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(result.current[1].data).toEqual({
        success: true,
        id: 't3_abc123',
        saved: false
      })
    })

    it('should handle server errors', async () => {
      // Override default handler with error response
      server.use(
        http.post('http://localhost:3000/api/reddit/save', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const {result} = renderHook(() => useSaveMutation())
      const [saveMutation] = result.current

      saveMutation({id: 't3_abc123', save: true})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })

      expect(result.current[1].error).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      // Override default handler with 401 response
      server.use(
        http.post('http://localhost:3000/api/reddit/save', () => {
          return HttpResponse.json({error: 'Unauthorized'}, {status: 401})
        })
      )

      const {result} = renderHook(() => useSaveMutation())
      const [saveMutation] = result.current

      saveMutation({id: 't3_abc123', save: true})

      await waitFor(() => {
        expect(result.current[1].isError).toBe(true)
      })

      const error = result.current[1].error as {status: number}
      expect(error.status).toBe(401)
    })

    it('should send correct payload structure', async () => {
      let capturedBody: SaveRequest | null = null

      server.use(
        http.post(
          'http://localhost:3000/api/reddit/save',
          async ({request}) => {
            capturedBody = (await request.json()) as SaveRequest
            return HttpResponse.json({
              success: true,
              id: 't3_abc123',
              saved: true
            })
          }
        )
      )

      const {result} = renderHook(() => useSaveMutation())
      const [saveMutation] = result.current

      saveMutation({id: 't3_abc123', save: true})

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true)
      })

      expect(capturedBody).toEqual({
        id: 't3_abc123',
        save: true
      })
    })
  })
})

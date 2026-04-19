import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useSubscribe} from './useSubscribe'

vi.mock('@/lib/actions/reddit/subreddits', () => ({
  toggleSubscription: vi.fn(async () => ({success: true}))
}))

vi.mock('@/lib/axiom/client', () => ({
  logger: {error: vi.fn()}
}))

describe('useSubscribe', () => {
  describe('initialization', () => {
    it('initializes with correct default values when not subscribed', () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: false
        })
      )

      expect(result.current.isSubscribed).toBe(false)
      expect(result.current.isPending).toBe(false)
      expect(typeof result.current.toggleSubscribe).toBe('function')
    })

    it('initializes with correct default values when subscribed', () => {
      const {result} = renderHook(() =>
        useSubscribe({
          subredditName: 'ProgrammerHumor',
          initialIsSubscribed: true
        })
      )

      expect(result.current.isSubscribed).toBe(true)
      expect(result.current.isPending).toBe(false)
    })
  })
})

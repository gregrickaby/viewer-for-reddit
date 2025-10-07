import {renderHook, waitFor} from '@/test-utils'
import {notifications} from '@mantine/notifications'
import {
  calculateScoreDelta,
  calculateVoteDirection,
  useVote,
  voteDirectionToState
} from './useVote'

// Mock client logger
vi.mock('@/lib/utils/logging/clientLogger', () => ({
  logClientError: vi.fn(),
  logClientInfo: vi.fn()
}))

// Mock the vote mutation
const mockVote = vi.fn()
vi.mock('@/lib/store/services/voteApi', async (importOriginal) => {
  const actual: Record<string, unknown> =
    await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useVoteMutation: () => [mockVote, {isLoading: false}]
  }
})

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

describe('useVote', () => {
  describe('calculateVoteDirection', () => {
    it('should return 0 when upvoting an already upvoted item (unvote)', () => {
      expect(calculateVoteDirection(1, true)).toBe(0)
    })

    it('should return 0 when downvoting an already downvoted item (unvote)', () => {
      expect(calculateVoteDirection(-1, false)).toBe(0)
    })

    it('should return 1 when upvoting a neutral item', () => {
      expect(calculateVoteDirection(1, null)).toBe(1)
    })

    it('should return 1 when upvoting a downvoted item', () => {
      expect(calculateVoteDirection(1, false)).toBe(1)
    })

    it('should return -1 when downvoting a neutral item', () => {
      expect(calculateVoteDirection(-1, null)).toBe(-1)
    })

    it('should return -1 when downvoting an upvoted item', () => {
      expect(calculateVoteDirection(-1, true)).toBe(-1)
    })
  })

  describe('calculateScoreDelta', () => {
    it('should return +1 when upvoting from neutral', () => {
      expect(calculateScoreDelta(1, null)).toBe(1)
    })

    it('should return +2 when upvoting from downvoted', () => {
      expect(calculateScoreDelta(1, false)).toBe(2)
    })

    it('should return -1 when downvoting from neutral', () => {
      expect(calculateScoreDelta(-1, null)).toBe(-1)
    })

    it('should return -2 when downvoting from upvoted', () => {
      expect(calculateScoreDelta(-1, true)).toBe(-2)
    })

    it('should return -1 when unvoting an upvote', () => {
      expect(calculateScoreDelta(0, true)).toBe(-1)
    })

    it('should return +1 when unvoting a downvote', () => {
      expect(calculateScoreDelta(0, false)).toBe(1)
    })

    it('should return 0 when unvoting from neutral', () => {
      expect(calculateScoreDelta(0, null)).toBe(0)
    })
  })

  describe('voteDirectionToState', () => {
    it('should return true for upvote direction (1)', () => {
      expect(voteDirectionToState(1)).toBe(true)
    })

    it('should return false for downvote direction (-1)', () => {
      expect(voteDirectionToState(-1)).toBe(false)
    })

    it('should return null for unvote direction (0)', () => {
      expect(voteDirectionToState(0)).toBe(null)
    })
  })

  describe('useVote hook', () => {
    beforeEach(() => {
      mockVote.mockClear()
      mockVote.mockReturnValue({unwrap: vi.fn().mockResolvedValue({})})
      vi.mocked(notifications.show).mockClear()
    })

    it('should initialize with provided score and vote state', () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 42,
          initialVote: true
        })
      )

      expect(result.current.currentScore).toBe(42)
      expect(result.current.currentVote).toBe(true)
      expect(result.current.isVoting).toBe(false)
    })

    it('should default to null vote state if not provided', () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 42
        })
      )

      expect(result.current.currentVote).toBe(null)
    })

    it('should handle upvote from neutral state', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: null
        })
      )

      await result.current.handleVote(1)

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 1})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(11)
      })
      expect(result.current.currentVote).toBe(true)
    })

    it('should handle downvote from neutral state', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: null
        })
      )

      await result.current.handleVote(-1)

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: -1})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(9)
      })
      expect(result.current.currentVote).toBe(false)
    })

    it('should handle upvote from downvoted state', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: false
        })
      )

      await result.current.handleVote(1)

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 1})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(12) // +2 (remove downvote + add upvote)
      })
      expect(result.current.currentVote).toBe(true)
    })

    it('should handle downvote from upvoted state', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: true
        })
      )

      await result.current.handleVote(-1)

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: -1})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(8) // -2 (remove upvote + add downvote)
      })
      expect(result.current.currentVote).toBe(false)
    })

    it('should handle unvote by clicking same upvote button', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: true
        })
      )

      await result.current.handleVote(1) // Click upvote again

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 0})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(9)
      })
      expect(result.current.currentVote).toBe(null)
    })

    it('should handle unvote by clicking same downvote button', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: false
        })
      )

      await result.current.handleVote(-1) // Click downvote again

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't3_abc123', dir: 0})
      })

      await waitFor(() => {
        expect(result.current.currentScore).toBe(11)
      })
      expect(result.current.currentVote).toBe(null)
    })

    it('should rollback optimistic update on error', async () => {
      const error = new Error('Network error')
      mockVote.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue(error)
      })

      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: null
        })
      )

      const initialScore = result.current.currentScore
      const initialVote = result.current.currentVote

      await result.current.handleVote(1)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Vote failed',
          message: 'Unable to submit vote. Please try again.',
          color: 'red',
          autoClose: 3000
        })
      })

      // Should rollback to initial state
      expect(result.current.currentScore).toBe(initialScore)
      expect(result.current.currentVote).toBe(initialVote)
    })

    it('should work with comment IDs (t1_)', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't1_xyz789',
          initialScore: 5,
          initialVote: null
        })
      )

      await result.current.handleVote(1)

      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith({id: 't1_xyz789', dir: 1})
      })
    })

    it('should handle multiple rapid votes correctly', async () => {
      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore: 10,
          initialVote: null
        })
      )

      // Upvote
      await result.current.handleVote(1)

      await waitFor(() => {
        expect(result.current.currentVote).toBe(true)
      })
      expect(result.current.currentScore).toBe(11)

      // Downvote (should go from +1 to -1, delta of -2)
      await result.current.handleVote(-1)

      await waitFor(() => {
        expect(result.current.currentVote).toBe(false)
      })
      expect(result.current.currentScore).toBe(9)

      // Unvote
      await result.current.handleVote(-1)

      await waitFor(() => {
        expect(result.current.currentVote).toBe(null)
      })
      expect(result.current.currentScore).toBe(10)
    })

    it('should show sign-in message for authentication errors', async () => {
      const initialScore = 100
      const initialVote = null

      // Mock vote mutation to return 401 error via unwrap()
      mockVote.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue({
          status: 401,
          data: {error: 'Authentication required'}
        })
      })

      const {result} = renderHook(() =>
        useVote({
          id: 't3_abc123',
          initialScore,
          initialVote
        })
      )

      // Attempt to upvote
      await result.current.handleVote(1)

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Sign in required',
          message: 'Please sign in to vote on posts and comments.',
          color: 'blue',
          autoClose: 3000
        })
      })

      // Should rollback to initial state
      expect(result.current.currentScore).toBe(initialScore)
      expect(result.current.currentVote).toBe(initialVote)
    })
  })
})

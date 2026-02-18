import {
  addSubredditToMultireddit,
  createMultireddit,
  deleteMultireddit,
  removeSubredditFromMultireddit,
  updateMultiredditName
} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useMultiredditManager} from './useMultiredditManager'

// Mock server actions before imports
vi.mock('@/lib/actions/reddit', () => ({
  createMultireddit: vi.fn(async () => ({
    success: true,
    path: '/user/testuser/m/new_multi'
  })),
  deleteMultireddit: vi.fn(async () => ({success: true})),
  updateMultiredditName: vi.fn(async () => ({success: true})),
  addSubredditToMultireddit: vi.fn(async () => ({success: true})),
  removeSubredditFromMultireddit: vi.fn(async () => ({success: true}))
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {error: vi.fn()}
}))

const mockCreate = vi.mocked(createMultireddit)
const mockDelete = vi.mocked(deleteMultireddit)
const mockRename = vi.mocked(updateMultiredditName)
const mockAddSub = vi.mocked(addSubredditToMultireddit)
const mockRemoveSub = vi.mocked(removeSubredditFromMultireddit)
const mockLogger = vi.mocked(logger)

const initialMultireddits = [
  {
    name: 'tech',
    displayName: 'Tech News',
    path: '/user/testuser/m/tech',
    subreddits: ['programming', 'javascript']
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    path: '/user/testuser/m/gaming',
    subreddits: ['gaming', 'pcgaming']
  }
]

describe('useMultiredditManager', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockDelete.mockClear()
    mockRename.mockClear()
    mockAddSub.mockClear()
    mockRemoveSub.mockClear()
    mockLogger.error.mockClear()

    // Reset to defaults
    mockCreate.mockResolvedValue({
      success: true,
      path: '/user/testuser/m/new_multi'
    })
    mockDelete.mockResolvedValue({success: true})
    mockRename.mockResolvedValue({success: true})
    mockAddSub.mockResolvedValue({success: true})
    mockRemoveSub.mockResolvedValue({success: true})
  })

  describe('initialization', () => {
    it('initializes with provided multireddits', () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      expect(result.current.multireddits).toHaveLength(2)
      expect(result.current.multireddits[0].name).toBe('tech')
      expect(result.current.multireddits[1].name).toBe('gaming')
    })

    it('initializes with no error and not pending', () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      expect(result.current.error).toBeNull()
      expect(result.current.isPending).toBe(false)
    })

    it('exposes all mutation functions', () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      expect(typeof result.current.create).toBe('function')
      expect(typeof result.current.remove).toBe('function')
      expect(typeof result.current.rename).toBe('function')
      expect(typeof result.current.addSubreddit).toBe('function')
      expect(typeof result.current.removeSubreddit).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })

    it('initializes with empty list', () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits: []})
      )

      expect(result.current.multireddits).toHaveLength(0)
    })
  })

  describe('create', () => {
    it('adds new multireddit on success', async () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits: []})
      )

      act(() => {
        result.current.create('new_multi', 'New Multi')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.multireddits).toHaveLength(1)
      expect(result.current.multireddits[0].name).toBe('new_multi')
      expect(result.current.multireddits[0].displayName).toBe('New Multi')
      expect(result.current.multireddits[0].subreddits).toEqual([])
      expect(mockCreate).toHaveBeenCalledWith('new_multi', 'New Multi')
    })

    it('sets error on failure and does not add multireddit', async () => {
      mockCreate.mockResolvedValueOnce({success: false, error: 'API error'})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits: []})
      )

      act(() => {
        result.current.create('new_multi', 'New Multi')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.multireddits).toHaveLength(0)
      expect(result.current.error).toBe('API error')
    })

    it('uses default error message when none provided', async () => {
      mockCreate.mockResolvedValueOnce({success: false})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits: []})
      )

      act(() => {
        result.current.create('new_multi', 'New Multi')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.error).toBe('Failed to create multireddit')
    })

    it('prevents race condition when pending', async () => {
      mockCreate.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true, path: '/user/u/m/m'}), 50)
          )
      )

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits: []})
      )

      act(() => {
        result.current.create('multi_one', 'Multi One')
      })

      expect(result.current.isPending).toBe(true)

      act(() => {
        result.current.create('multi_two', 'Multi Two')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('remove', () => {
    it('removes multireddit with optimistic update on success', async () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.remove('/user/testuser/m/tech')
      })

      // Optimistic removal
      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )
      ).toBeUndefined()

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.multireddits).toHaveLength(1)
      expect(result.current.multireddits[0].name).toBe('gaming')
      expect(mockDelete).toHaveBeenCalledWith('/user/testuser/m/tech')
    })

    it('restores multireddit on failure', async () => {
      mockDelete.mockResolvedValueOnce({success: false, error: 'Delete failed'})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.remove('/user/testuser/m/tech')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.multireddits).toHaveLength(2)
      expect(result.current.error).toBe('Delete failed')
    })

    it('prevents race condition when pending', async () => {
      mockDelete.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 50)
          )
      )

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.remove('/user/testuser/m/tech')
      })

      expect(result.current.isPending).toBe(true)

      act(() => {
        result.current.remove('/user/testuser/m/gaming')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('rename', () => {
    it('updates display name with optimistic update on success', async () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.rename('/user/testuser/m/tech', 'Tech & Science')
      })

      // Optimistic update
      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.displayName
      ).toBe('Tech & Science')

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockRename).toHaveBeenCalledWith(
        '/user/testuser/m/tech',
        'Tech & Science'
      )
    })

    it('restores original name on failure', async () => {
      mockRename.mockResolvedValueOnce({success: false, error: 'Rename failed'})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.rename('/user/testuser/m/tech', 'New Name')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.displayName
      ).toBe('Tech News')
      expect(result.current.error).toBe('Rename failed')
    })
  })

  describe('addSubreddit', () => {
    it('adds subreddit with optimistic update on success', async () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.addSubreddit('/user/testuser/m/tech', 'typescript')
      })

      // Optimistic update
      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.subreddits
      ).toContain('typescript')

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockAddSub).toHaveBeenCalledWith(
        '/user/testuser/m/tech',
        'typescript'
      )
    })

    it('restores subreddits on failure', async () => {
      mockAddSub.mockResolvedValueOnce({success: false, error: 'Add failed'})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.addSubreddit('/user/testuser/m/tech', 'typescript')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.subreddits
      ).not.toContain('typescript')
      expect(result.current.error).toBe('Add failed')
    })

    it('prevents race condition when pending', async () => {
      mockAddSub.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 50)
          )
      )

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.addSubreddit('/user/testuser/m/tech', 'typescript')
      })

      act(() => {
        result.current.addSubreddit('/user/testuser/m/tech', 'rust')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockAddSub).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeSubreddit', () => {
    it('removes subreddit with optimistic update on success', async () => {
      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.removeSubreddit('/user/testuser/m/tech', 'javascript')
      })

      // Optimistic removal
      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.subreddits
      ).not.toContain('javascript')

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockRemoveSub).toHaveBeenCalledWith(
        '/user/testuser/m/tech',
        'javascript'
      )
    })

    it('restores subreddits on failure', async () => {
      mockRemoveSub.mockResolvedValueOnce({
        success: false,
        error: 'Remove failed'
      })

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.removeSubreddit('/user/testuser/m/tech', 'javascript')
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(
        result.current.multireddits.find(
          (m) => m.path === '/user/testuser/m/tech'
        )?.subreddits
      ).toContain('javascript')
      expect(result.current.error).toBe('Remove failed')
    })
  })

  describe('clearError', () => {
    it('clears the error', async () => {
      mockDelete.mockResolvedValueOnce({success: false, error: 'Some error'})

      const {result} = renderHook(() =>
        useMultiredditManager({initialMultireddits})
      )

      act(() => {
        result.current.remove('/user/testuser/m/tech')
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Some error')
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})

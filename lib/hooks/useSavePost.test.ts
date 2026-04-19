import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useSavePost} from './useSavePost'

vi.mock('@/lib/actions/reddit/users', () => ({
  savePost: vi.fn(async () => ({success: true}))
}))

describe('useSavePost', () => {
  const mockOptions = {
    postName: 't3_test123',
    initialSaved: false
  }

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useSavePost(mockOptions))

    expect(result.current.isSaved).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.toggleSave).toBe('function')
  })

  it('initializes with saved state when initialSaved is true', () => {
    const {result} = renderHook(() =>
      useSavePost({...mockOptions, initialSaved: true})
    )

    expect(result.current.isSaved).toBe(true)
  })
})

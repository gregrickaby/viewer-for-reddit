import {renderHook} from '@/test-utils'
import {useHotkeys} from '@mantine/hooks'
import {describe, expect, it, vi} from 'vitest'
import {useKeyboardNav} from './useKeyboardNav'

// Mock @mantine/hooks
vi.mock('@mantine/hooks', () => ({
  useHotkeys: vi.fn()
}))

describe('useKeyboardNav', () => {
  it('should register hotkeys when enabled is true', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    renderHook(() =>
      useKeyboardNav({
        enabled: true,
        onNext,
        onPrevious,
        onParent
      })
    )

    expect(useHotkeys).toHaveBeenCalledWith(
      [
        ['j', onNext],
        ['k', onPrevious],
        ['u', onParent]
      ],
      ['INPUT', 'TEXTAREA']
    )
  })

  it('should not register hotkeys when enabled is false', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    renderHook(() =>
      useKeyboardNav({
        enabled: false,
        onNext,
        onPrevious,
        onParent
      })
    )

    expect(useHotkeys).toHaveBeenCalledWith([], ['INPUT', 'TEXTAREA'])
  })

  it('should update hotkeys when enabled changes', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    let enabled = false

    const {rerender} = renderHook(() =>
      useKeyboardNav({
        enabled,
        onNext,
        onPrevious,
        onParent
      })
    )

    // Initially disabled
    expect(useHotkeys).toHaveBeenLastCalledWith([], ['INPUT', 'TEXTAREA'])

    // Enable
    enabled = true
    rerender()

    expect(useHotkeys).toHaveBeenLastCalledWith(
      [
        ['j', onNext],
        ['k', onPrevious],
        ['u', onParent]
      ],
      ['INPUT', 'TEXTAREA']
    )
  })

  it('should update hotkeys when callbacks change', () => {
    const onNext1 = vi.fn()
    const onNext2 = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    let onNext = onNext1

    const {rerender} = renderHook(() =>
      useKeyboardNav({
        enabled: true,
        onNext,
        onPrevious,
        onParent
      })
    )

    expect(useHotkeys).toHaveBeenLastCalledWith(
      [
        ['j', onNext1],
        ['k', onPrevious],
        ['u', onParent]
      ],
      ['INPUT', 'TEXTAREA']
    )

    // Change callback
    onNext = onNext2
    rerender()

    expect(useHotkeys).toHaveBeenLastCalledWith(
      [
        ['j', onNext2],
        ['k', onPrevious],
        ['u', onParent]
      ],
      ['INPUT', 'TEXTAREA']
    )
  })

  it('should exclude INPUT and TEXTAREA elements', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    renderHook(() =>
      useKeyboardNav({
        enabled: true,
        onNext,
        onPrevious,
        onParent
      })
    )

    // Verify that INPUT and TEXTAREA are excluded
    const calls = vi.mocked(useHotkeys).mock.calls
    const lastCall = calls.at(-1)
    expect(lastCall?.[1]).toEqual(['INPUT', 'TEXTAREA'])
  })

  it('should register j, k, and u keys in correct order', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onParent = vi.fn()

    renderHook(() =>
      useKeyboardNav({
        enabled: true,
        onNext,
        onPrevious,
        onParent
      })
    )

    const calls = vi.mocked(useHotkeys).mock.calls
    const lastCall = calls.at(-1)
    const hotkeys = lastCall?.[0]

    expect(hotkeys).toEqual([
      ['j', onNext],
      ['k', onPrevious],
      ['u', onParent]
    ])
  })
})

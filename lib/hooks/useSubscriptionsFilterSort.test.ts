import {act, renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useSubscriptionsFilterSort} from './useSubscriptionsFilterSort'

describe('useSubscriptionsFilterSort', () => {
  const mockSubscriptions = [
    {name: 'programming', displayName: 'r/programming', icon: ''},
    {name: 'javascript', displayName: 'r/javascript', icon: ''},
    {name: 'typescript', displayName: 'r/typescript', icon: ''}
  ]

  it('initializes with provided subscriptions', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: mockSubscriptions
      })
    )

    expect(result.current.filteredSubscriptions).toEqual(mockSubscriptions)
    expect(result.current.sortBy).toBe('default')
    expect(result.current.searchQuery).toBe('')
  })

  it('maintains subscription order with default sort', () => {
    const subscriptions = [
      {name: 'zebra', displayName: 'r/zebra'},
      {name: 'apple', displayName: 'r/apple'},
      {name: 'banana', displayName: 'r/banana'}
    ]

    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: subscriptions
      })
    )

    // Should maintain original order with default sort
    expect(result.current.sortBy).toBe('default')
    expect(result.current.filteredSubscriptions[0].name).toBe('zebra')
    expect(result.current.filteredSubscriptions[1].name).toBe('apple')
    expect(result.current.filteredSubscriptions[2].name).toBe('banana')
  })

  it('filters subscriptions by search query', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: mockSubscriptions
      })
    )

    act(() => {
      result.current.setSearchQuery('java')
    })

    expect(result.current.filteredSubscriptions).toHaveLength(1)
    expect(result.current.filteredSubscriptions[0].name).toBe('javascript')
  })

  it('filters are case-insensitive', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: mockSubscriptions
      })
    )

    act(() => {
      result.current.setSearchQuery('JAVA')
    })

    expect(result.current.filteredSubscriptions).toHaveLength(1)
    expect(result.current.filteredSubscriptions[0].name).toBe('javascript')
  })

  it('sorts subscriptions A-Z', () => {
    const subscriptions = [
      {name: 'zebra', displayName: 'r/zebra'},
      {name: 'apple', displayName: 'r/apple'},
      {name: 'banana', displayName: 'r/banana'}
    ]

    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: subscriptions
      })
    )

    act(() => {
      result.current.setSortBy('a-z')
    })

    expect(result.current.sortBy).toBe('a-z')
    expect(result.current.filteredSubscriptions[0].name).toBe('apple')
    expect(result.current.filteredSubscriptions[1].name).toBe('banana')
    expect(result.current.filteredSubscriptions[2].name).toBe('zebra')
  })

  it('sorts subscriptions Z-A', () => {
    const subscriptions = [
      {name: 'zebra', displayName: 'r/zebra'},
      {name: 'apple', displayName: 'r/apple'},
      {name: 'banana', displayName: 'r/banana'}
    ]

    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: subscriptions
      })
    )

    act(() => {
      result.current.setSortBy('z-a')
    })

    expect(result.current.sortBy).toBe('z-a')
    expect(result.current.filteredSubscriptions[0].name).toBe('zebra')
    expect(result.current.filteredSubscriptions[1].name).toBe('banana')
    expect(result.current.filteredSubscriptions[2].name).toBe('apple')
  })

  it('combines filter and sort', () => {
    const subscriptions = [
      {name: 'javascript', displayName: 'r/javascript'},
      {name: 'java', displayName: 'r/java'},
      {name: 'typescript', displayName: 'r/typescript'},
      {name: 'python', displayName: 'r/python'}
    ]

    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: subscriptions
      })
    )

    act(() => {
      result.current.setSearchQuery('script')
      result.current.setSortBy('a-z')
    })

    expect(result.current.filteredSubscriptions).toHaveLength(2)
    expect(result.current.filteredSubscriptions[0].name).toBe('javascript')
    expect(result.current.filteredSubscriptions[1].name).toBe('typescript')
  })

  it('returns empty array when no subscriptions match search', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: mockSubscriptions
      })
    )

    act(() => {
      result.current.setSearchQuery('nonexistent')
    })

    expect(result.current.filteredSubscriptions).toHaveLength(0)
  })

  it('resets sort to default', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: mockSubscriptions
      })
    )

    act(() => {
      result.current.setSortBy('a-z')
    })

    expect(result.current.sortBy).toBe('a-z')

    act(() => {
      result.current.setSortBy('default')
    })

    expect(result.current.sortBy).toBe('default')
    expect(result.current.filteredSubscriptions).toEqual(mockSubscriptions)
  })

  it('handles empty initial subscriptions', () => {
    const {result} = renderHook(() =>
      useSubscriptionsFilterSort({
        initialSubscriptions: []
      })
    )

    expect(result.current.filteredSubscriptions).toEqual([])
    expect(result.current.sortBy).toBe('default')
  })
})

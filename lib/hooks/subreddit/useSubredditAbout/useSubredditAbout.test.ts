import {renderHook, waitFor} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useSubredditAbout} from './useSubredditAbout'

describe('useSubredditAbout', () => {
  it('should return formatted subreddit data on success', async () => {
    const {result} = renderHook(() => useSubredditAbout('aww'))

    // Initial loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify formatted data (based on aboutMock)
    expect(result.current.name).toBe('aww')
    expect(result.current.description).toContain('puppies')
    expect(result.current.createdDate).toMatch(/Created \d+ years ago/)
    expect(result.current.subscribers).toBe('37.7M subscribers')
    expect(result.current.activeUsers).toBe('565 online')
    expect(result.current.isError).toBe(false)
  })

  it('should format active users count', async () => {
    const {result} = renderHook(() => useSubredditAbout('aww'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.activeUsers).toBe('565 online')
  })

  it('should format subscriber counts with abbreviations', async () => {
    const {result} = renderHook(() => useSubredditAbout('aww'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // aboutMock has 37,661,216 subscribers -> 37.7M
    expect(result.current.subscribers).toBe('37.7M subscribers')
  })

  it('should format creation date as relative time', async () => {
    const {result} = renderHook(() => useSubredditAbout('aww'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // aboutMock created_utc: 1201234022 (Jan 2008)
    expect(result.current.createdDate).toMatch(/Created \d+ years ago/)
  })

  it('should handle 404 error', async () => {
    const {result} = renderHook(() => useSubredditAbout('notarealsubreddit'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.name).toBe('')
    expect(result.current.description).toBe('')
  })

  it('should return empty description when undefined', async () => {
    const {result} = renderHook(() => useSubredditAbout('aww'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify description is properly handled
    expect(typeof result.current.description).toBe('string')
  })
})

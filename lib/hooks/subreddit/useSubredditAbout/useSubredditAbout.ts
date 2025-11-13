import {
  formatActiveUsers,
  formatCreatedDate,
  formatSubscriberCount
} from '@/lib/domain/subreddit'
import {useGetSubredditAboutFullQuery} from '@/lib/store/services/subredditApi'

/**
 * Hook for fetching and formatting subreddit about information.
 *
 * Orchestrates RTK Query data fetching with domain layer formatting functions
 * to provide ready-to-render subreddit metadata. Returns formatted strings
 * for display in UI components.
 *
 * @param subreddit - The subreddit name (e.g., "aww", "programming")
 *
 * @returns Object containing formatted subreddit data and loading/error states
 *
 * @example
 * ```tsx
 * const {name, description, createdDate, subscribers, activeUsers, isLoading} =
 *   useSubredditAbout('aww')
 *
 * if (isLoading) return <Loader />
 * return <div>{name} - {subscribers}</div>
 * ```
 */
export function useSubredditAbout(subreddit: string) {
  const {data, isLoading, isError, error} =
    useGetSubredditAboutFullQuery(subreddit)

  return {
    name: data?.display_name ?? '',
    description: data?.public_description ?? '',
    createdDate: data?.created_utc
      ? formatCreatedDate(data.created_utc)
      : 'Unknown',
    subscribers: data?.subscribers
      ? `${formatSubscriberCount(data.subscribers)} subscribers`
      : '0 subscribers',
    activeUsers: formatActiveUsers(
      (data as any)?.active_user_count ?? (data as any)?.accounts_active
    ),
    isLoading,
    isError,
    error
  }
}

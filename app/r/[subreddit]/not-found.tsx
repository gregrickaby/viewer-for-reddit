import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'

/**
 * Subreddit not found page.
 * Shown when notFound() is called from a subreddit page.
 */
export default function SubredditNotFound() {
  return (
    <ErrorDisplay
      title="Subreddit not found"
      message="This subreddit doesn't exist or has been banned."
      showRetry={false}
      showHome
    />
  )
}

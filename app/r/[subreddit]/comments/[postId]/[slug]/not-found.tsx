import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'

/**
 * Post not found page.
 * Shown when notFound() is called from a post detail page.
 */
export default function PostNotFound() {
  return (
    <ErrorDisplay
      title="Post not found"
      message="This post may have been deleted or removed."
      showRetry={false}
      showHome
    />
  )
}

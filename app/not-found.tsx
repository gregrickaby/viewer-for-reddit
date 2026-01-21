import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'

/**
 * Root not-found page - handles unmatched URLs.
 * This is shown when Next.js can't find a matching route.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <ErrorDisplay
      title="404 - Page Not Found"
      message="The page you are looking for does not exist or has been moved."
      showRetry={false}
      showHome
    />
  )
}

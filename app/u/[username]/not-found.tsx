import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'

/**
 * User profile not found page.
 * Shown when notFound() is called from a user profile page.
 */
export default function UserNotFound() {
  return (
    <ErrorDisplay
      title="User not found"
      message="This user account doesn't exist or has been deleted."
      showRetry={false}
      showHome
    />
  )
}

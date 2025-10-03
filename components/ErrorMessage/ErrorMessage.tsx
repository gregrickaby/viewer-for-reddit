import {Alert, Button, Stack, Title} from '@mantine/core'
import Link from 'next/link'
import {IoAlert} from 'react-icons/io5'
import {MdError} from 'react-icons/md'

export type ErrorType = 'user' | 'subreddit' | 'post' | 'generic'

interface ErrorMessageProps {
  error: unknown
  type?: ErrorType
  resourceName?: string
  fallbackUrl?: string
  compact?: boolean
}

/**
 * Get error message for 404 status.
 */
function get404Message(type: ErrorType, resourceName?: string): string {
  const messages = {
    user: `User u/${resourceName} not found. This account may have been deleted, suspended, or does not exist.`,
    subreddit: `Subreddit r/${resourceName} not found. It may have been banned, deleted, or doesn't exist.`,
    post: 'Post not found',
    generic: 'The requested resource was not found.'
  }
  return messages[type]
}

/**
 * Get error message for 403 status.
 */
function get403Message(type: ErrorType, resourceName?: string): string {
  const messages = {
    user: `Access denied to u/${resourceName}. This user's profile may be private or restricted.`,
    subreddit: `Subreddit r/${resourceName} is private or restricted. You need special permission to view this community.`,
    post: 'This subreddit is private or restricted',
    generic: 'Access denied. You do not have permission to view this resource.'
  }
  return messages[type]
}

/**
 * Get default error message.
 */
function getDefaultMessage(type: ErrorType): string {
  const messages = {
    user: 'Unable to load profile from Reddit API. Please try again.',
    subreddit: 'Unable to load posts from Reddit. Please try again.',
    post: 'Failed to load post',
    generic: 'An error occurred. Please try again.'
  }
  return messages[type]
}

/**
 * Get status-specific error message based on HTTP status code.
 *
 * @param status - HTTP status code
 * @param type - Type of resource (user, subreddit, post, generic)
 * @param resourceName - Name of the resource (username, subreddit name, etc.)
 * @returns User-friendly error message
 */
function getErrorMessage(
  status: number,
  type: ErrorType,
  resourceName?: string
): string {
  switch (status) {
    case 404:
      return get404Message(type, resourceName)
    case 403:
      return get403Message(type, resourceName)
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Reddit servers are experiencing issues. Please try again later.'
    default:
      return getDefaultMessage(type)
  }
}

/**
 * Get title for error message based on type.
 */
function getErrorTitle(type: ErrorType): string {
  const titles = {
    user: 'Profile Not Available',
    subreddit: 'Subreddit Not Available',
    post: 'Post Not Available',
    generic: 'Error'
  }
  return titles[type]
}

/**
 * ErrorMessage component for displaying user-friendly error messages.
 *
 * Features:
 * - Status-specific error messages for different HTTP status codes
 * - Support for different resource types (user, subreddit, post, generic)
 * - Compact mode for inline errors (uses Alert) or full-page errors (uses Stack)
 * - Optional fallback URL with button
 *
 * @param error - Error object from RTK Query or similar
 * @param type - Type of resource (user, subreddit, post, generic)
 * @param resourceName - Name of the resource for personalized messages
 * @param fallbackUrl - Optional URL to navigate to on error
 * @param compact - Use compact Alert style instead of full Stack layout
 */
export function ErrorMessage({
  error,
  type = 'generic',
  resourceName,
  fallbackUrl = '/',
  compact = false
}: Readonly<ErrorMessageProps>) {
  let statusCode: number | undefined
  let errorMessage = 'An error occurred. Please try again.'

  // Extract status code from error object
  if (error && typeof error === 'object' && 'status' in error) {
    statusCode = error.status as number
    errorMessage = getErrorMessage(statusCode, type, resourceName)
  }

  const title = getErrorTitle(type)

  // Compact mode - use Alert component
  if (compact) {
    return (
      <Alert
        icon={<IoAlert size={16} />}
        title={title}
        color="red"
        variant="light"
      >
        {errorMessage}
        {fallbackUrl && type !== 'generic' && (
          <>
            {'. '}
            <Link
              data-umami-event="error message link"
              href={
                type === 'subreddit' && resourceName
                  ? `/r/${resourceName}`
                  : fallbackUrl
              }
            >
              {type === 'post' ? `return to r/${resourceName}` : 'Try Again'}
            </Link>
            .
          </>
        )}
      </Alert>
    )
  }

  // Full mode - use Stack with title and button
  return (
    <Stack align="center" mt="lg" gap="md">
      <Title order={2} c="red">
        <MdError size={24} /> {title}
      </Title>
      <Alert
        icon={<IoAlert size={20} />}
        color="red"
        variant="light"
        style={{maxWidth: '500px', textAlign: 'center'}}
      >
        {errorMessage}
      </Alert>
      {fallbackUrl && (
        <Button
          color="gray"
          component={Link}
          data-umami-event="error message button"
          href={fallbackUrl}
        >
          {type === 'subreddit' || type === 'user'
            ? 'Go to Homepage'
            : 'Go Back'}
        </Button>
      )}
    </Stack>
  )
}

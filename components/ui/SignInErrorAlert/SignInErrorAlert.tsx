import {Alert} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'

// Reddit's own OAuth error codes, plus our `login_failed` for state/CSRF
// validation failures. Keyed by the exact `?error=` value so an unrecognized
// or tampered code falls through to the generic message below rather than
// rendering unknown text.
const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "Looks like you declined Reddit's sign-in prompt. Reddit no longer allows free access to their content API's. Please try signing in again and click allow.",
  login_failed:
    'Something went wrong verifying your sign-in request. Please try again.'
}
const DEFAULT_SIGN_IN_ERROR_MESSAGE =
  "Please try again, or sign in when you're ready."

interface SignInErrorAlertProps {
  /** OAuth error code from a failed or declined sign-in redirect, e.g. "access_denied" */
  error?: string
}

/**
 * Explains why the user landed back on the homepage after a Reddit sign-in
 * attempt failed or was declined. Renders nothing when there's no error.
 */
export function SignInErrorAlert({error}: Readonly<SignInErrorAlertProps>) {
  if (!error) return null

  const message = SIGN_IN_ERROR_MESSAGES[error] ?? DEFAULT_SIGN_IN_ERROR_MESSAGE

  return (
    <Alert
      aria-live="polite"
      color="red"
      icon={<IconAlertCircle size={20} />}
      mb="xl"
      title="Sign-in didn't complete"
    >
      {message}
    </Alert>
  )
}

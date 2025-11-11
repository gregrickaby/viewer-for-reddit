import {useSaveMutation} from '@/lib/store/services/saveApi'
import {logClientError} from '@/lib/utils/logging/clientLogger'
import {notifications} from '@mantine/notifications'
import {useState} from 'react'

/**
 * Type guard to check if error is an authentication error (401 status).
 */
function isAuthError(error: unknown): error is {status: number} {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as {status: number}).status === 'number' &&
    (error as {status: number}).status === 401
  )
}

/**
 * Props for useSave hook
 */
export interface UseSaveProps {
  /**
   * Post ID (fullname) - e.g., t3_abc123
   */
  id: string

  /**
   * Initial saved state from Reddit API
   */
  initialSaved?: boolean
}

/**
 * Return type for useSave hook
 */
export interface UseSaveReturn {
  /**
   * Handle save/unsave action
   */
  handleSave: () => Promise<void>

  /**
   * Current saved state (optimistic)
   */
  isSaved: boolean

  /**
   * Whether a save operation is in progress
   */
  isSaving: boolean
}

/**
 * Custom hook for managing post save state and interactions.
 *
 * Handles:
 * - Save/unsave business logic
 * - Optimistic updates for immediate feedback
 * - Error handling with user notifications
 * - Loading states
 *
 * The actual cache updates (UserSavedPosts invalidation) happen in saveApi.
 * This hook maintains local optimistic state for immediate UI feedback,
 * which will be replaced by server state once the mutation completes.
 *
 * @param props - Hook configuration
 * @returns Save state and handlers
 *
 * @example
 * const {handleSave, isSaved, isSaving} = useSave({
 *   id: 't3_abc123',
 *   initialSaved: false
 * })
 */
export function useSave({
  id,
  initialSaved = false
}: UseSaveProps): UseSaveReturn {
  const [save, {isLoading}] = useSaveMutation()

  // Local state for optimistic updates
  // Provides immediate feedback while the API request is in flight
  const [optimisticSaved, setOptimisticSaved] = useState<boolean>(
    initialSaved ?? false
  )

  /**
   * Handle save/unsave button click.
   *
   * Flow:
   * 1. Toggle save state (optimistic update)
   * 2. Call mutation
   * 3. Show success notification
   * 4. On error: rollback state + show error notification
   *
   * @returns Promise that resolves when operation completes
   */
  const handleSave = async () => {
    const newSavedState = !optimisticSaved

    // Store previous state for rollback
    const previousSaved = optimisticSaved

    // Optimistic update (immediate UI feedback)
    setOptimisticSaved(newSavedState)

    try {
      // Call mutation - saveApi will handle cache invalidation
      await save({id, save: newSavedState}).unwrap()

      // Show success notification
      notifications.show({
        title: newSavedState ? 'Post saved' : 'Post unsaved',
        message: newSavedState
          ? 'You can view this post in your saved posts feed.'
          : 'Post removed from your saved posts.',
        color: 'green',
        autoClose: 3000
      })
    } catch (error: unknown) {
      // Rollback optimistic updates on error
      setOptimisticSaved(previousSaved)

      // Check if error is authentication-related (401 status)
      const authError = isAuthError(error)

      // Show user-friendly error notification
      notifications.show({
        title: authError ? 'Sign in required' : 'Save failed',
        message: authError
          ? 'Please sign in to save posts.'
          : 'Unable to save post. Please try again.',
        color: authError ? 'blue' : 'red',
        autoClose: 3000
      })

      // Log error for debugging
      logClientError('Save operation failed', error, {
        component: 'useSave',
        action: 'handleSave',
        id,
        saveAction: newSavedState,
        isAuthError: authError
      })
    }
  }

  return {
    handleSave,
    isSaved: optimisticSaved,
    isSaving: isLoading
  }
}

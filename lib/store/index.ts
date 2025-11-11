import {authSlice} from '@/lib/store/features/authSlice'
import {commentExpansionSlice} from '@/lib/store/features/commentExpansionSlice'
import {settingsSlice} from '@/lib/store/features/settingsSlice'
import {transientSlice} from '@/lib/store/features/transientSlice'
import {authenticatedApi} from '@/lib/store/services/authenticatedApi'
import {commentsApi} from '@/lib/store/services/commentsApi'
import {postsApi} from '@/lib/store/services/postsApi'
import {saveApi} from '@/lib/store/services/saveApi'
import {searchApi} from '@/lib/store/services/searchApi'
import {subredditApi} from '@/lib/store/services/subredditApi'
import {userApi} from '@/lib/store/services/userApi'
import {voteApi} from '@/lib/store/services/voteApi'
import {
  combineSlices,
  configureStore,
  type Action,
  type Middleware,
  type ThunkAction
} from '@reduxjs/toolkit'
import {setupListeners} from '@reduxjs/toolkit/query'

/**
 * Middleware to handle cross-API tag invalidation.
 *
 * When a save/unsave mutation completes in saveApi, this middleware
 * invalidates the UserSavedPosts tag in authenticatedApi, causing
 * the saved posts feed to refetch and update in real-time.
 */
const crossApiInvalidationMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    const result = next(action)

    // Listen for successful save/unsave mutations
    if (saveApi.endpoints.save.matchFulfilled(action)) {
      // Invalidate UserSavedPosts tag in authenticatedApi
      store.dispatch(authenticatedApi.util.invalidateTags(['UserSavedPosts']))
    }

    return result
  }

// Combine all slices into a single reducer function.
const rootReducer = combineSlices(
  postsApi,
  searchApi,
  commentsApi,
  userApi,
  subredditApi,
  authenticatedApi,
  voteApi,
  saveApi,
  authSlice,
  commentExpansionSlice,
  settingsSlice,
  transientSlice
)

// Infer the `RootState` type from the root reducer.
export type RootState = ReturnType<typeof rootReducer>

/**
 * Create a new Redux store with the combined slices.
 *
 * The store setup is wrapped in `makeStore` to allow reuse when
 * setting up tests that need the same store config.
 *
 * @param preloadedState - The initial state to populate the store with.
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(postsApi.middleware)
        .concat(searchApi.middleware)
        .concat(commentsApi.middleware)
        .concat(userApi.middleware)
        .concat(subredditApi.middleware)
        .concat(authenticatedApi.middleware)
        .concat(voteApi.middleware)
        .concat(saveApi.middleware)
        .concat(crossApiInvalidationMiddleware),
    preloadedState
  })
  setupListeners(store.dispatch)
  return store
}

// Export the store instance.
export const store = makeStore()

// Infer the type of `store`.
export type AppStore = typeof store

// Infer the `AppDispatch` type from the store itself.
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>

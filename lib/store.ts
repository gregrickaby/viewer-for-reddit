import { settingsSlice } from '@/lib/features/settingsSlice'
import { transientSlice } from '@/lib/features/transientSlice'
import { privateApi } from '@/lib/services/privateApi'
import { publicApi } from '@/lib/services/publicApi'
import type { Action, ThunkAction } from '@reduxjs/toolkit'
import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Combine all slices into a single reducer function.
const rootReducer = combineSlices(
  privateApi,
  publicApi,
  settingsSlice,
  transientSlice
)

// Infer the `RootState` type from the root reducer.
export type RootState = ReturnType<typeof rootReducer>

/**
 * Create a new Redux store with the combined slices.
 *
 * The store setup is wrapped in `makeStore` to allow reuse when
 * setting uptests that need the same store config.
 *
 * @param preloadedState - The initial state to populate the store with.
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        publicApi.middleware,
        privateApi.middleware
      ),
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

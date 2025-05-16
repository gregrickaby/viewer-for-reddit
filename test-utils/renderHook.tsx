import {makeStore, type AppStore, type RootState} from '@/lib/store'
import {StoreProvider} from '@/lib/store/StoreProvider'
import {MantineProvider} from '@mantine/core'
import {renderHook as rtlRenderHook} from '@testing-library/react'

/**
 * Extended renderHook options.
 */
interface ExtendedRenderHookOptions {
  /** Optional. Initial Redux state for the test store. */
  preloadedState?: Partial<RootState>
  /** Optional. Pass a custom store (for testing). */
  store?: AppStore
}

/**
 * Custom renderHook function with Store, Form, and Theme providers.
 *
 * Returns Testing Library's renderHook result plus the Redux store.
 *
 * @param callback - The hook function to test.
 * @param options - Optional preloaded state or custom store.
 */
export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  {
    preloadedState = {},
    store = makeStore(preloadedState),
    ...renderOptions
  }: Readonly<ExtendedRenderHookOptions> = {}
) {
  // Create a wrapper component including all providers.
  function Wrapper({children}: Readonly<{children: React.ReactNode}>) {
    return (
      <StoreProvider store={store}>
        <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
      </StoreProvider>
    )
  }

  // Render the hook with providers and return the store for test access.
  return {
    store,
    ...rtlRenderHook(callback, {wrapper: Wrapper, ...renderOptions})
  }
}

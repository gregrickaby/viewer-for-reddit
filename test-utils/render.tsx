import {makeStore, type AppStore, type RootState} from '@/lib/store'
import {StoreProvider} from '@/lib/store/StoreProvider'
import {MantineProvider} from '@mantine/core'
import {
  render as testingLibraryRender,
  type RenderOptions
} from '@testing-library/react'
import type {PropsWithChildren, ReactElement} from 'react'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
}

/**
 * Custom render function that wraps the UI with all required providers.
 * Supports optional Redux preloaded state or a custom store.
 */
export function render(
  ui: ReactElement,
  {
    preloadedState,
    store = makeStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const Wrapper = ({children}: PropsWithChildren) => (
    <StoreProvider store={store}>
      <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
    </StoreProvider>
  )

  return {
    store,
    ...testingLibraryRender(ui, {wrapper: Wrapper, ...renderOptions})
  }
}

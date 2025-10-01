import {makeStore, type AppStore, type RootState} from '@/lib/store'
import {StoreProvider} from '@/lib/store/StoreProvider'
import {MantineProvider} from '@mantine/core'
import {render as rtlRender, type RenderOptions} from '@testing-library/react'
import {SessionProvider} from 'next-auth/react'
import type {Session} from 'next-auth'
import type {PropsWithChildren, ReactElement} from 'react'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
  session?: Session | null
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
    session = null,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const Wrapper = ({children}: PropsWithChildren) => (
    <StoreProvider store={store}>
      <SessionProvider
        session={session}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
      </SessionProvider>
    </StoreProvider>
  )

  return {
    store,
    ...rtlRender(ui, {wrapper: Wrapper, ...renderOptions})
  }
}

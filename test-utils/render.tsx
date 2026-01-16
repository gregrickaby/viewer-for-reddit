import {MantineProvider} from '@mantine/core'
import {render as rtlRender, type RenderOptions} from '@testing-library/react'
import type {PropsWithChildren, ReactElement} from 'react'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {}

/**
 * Custom render function that wraps the UI with all required providers.
 */
export function render(
  ui: ReactElement,
  renderOptions: ExtendedRenderOptions = {}
) {
  const Wrapper = ({children}: PropsWithChildren) => (
    <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
  )

  return rtlRender(ui, {wrapper: Wrapper, ...renderOptions})
}

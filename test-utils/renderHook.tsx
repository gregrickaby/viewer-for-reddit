import {MantineProvider} from '@mantine/core'
import {renderHook as rtlRenderHook} from '@testing-library/react'

/**
 * Custom renderHook function with Theme provider.
 *
 * @param callback - The hook function to test.
 * @param options - Optional render options.
 */
export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  renderOptions = {}
) {
  // Create a wrapper component including all providers.
  function Wrapper({children}: Readonly<{children: React.ReactNode}>) {
    return (
      <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
    )
  }

  // Render the hook with providers.
  return rtlRenderHook(callback, {wrapper: Wrapper, ...renderOptions})
}

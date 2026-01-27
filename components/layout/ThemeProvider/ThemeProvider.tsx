'use client'

import {createTheme, MantineColorsTuple, MantineProvider} from '@mantine/core'
import {Notifications} from '@mantine/notifications'
import '@mantine/notifications/styles.css'

/**
 * Reddit color scheme based on official branding.
 * Uses Reddit's primary orange color (#ff4500) with generated shades.
 *
 * @see https://mantine.dev/theming/colors/#primarycolor
 * @see https://redditbrand.lingoapp.com/s/Color-R7y72J?v=40
 */
const redditColorScheme: MantineColorsTuple = [
  '#ffeee4',
  '#ffdbcd',
  '#ffb69b',
  '#ff8e64',
  '#fe6d37',
  '#fe5719',
  '#ff4500',
  '#e43c00',
  '#cb3400',
  '#b22900'
]

/**
 * Mantine theme configuration.
 * Sets up the application's design system with custom colors and defaults.
 *
 * Features:
 * - Reddit orange color scheme
 * - System font stack
 * - Default border radius (md)
 * - Anchor component defaults (no underline)
 *
 * @see https://mantine.dev/theming/theme-object/
 */
const theme = createTheme({
  colors: {redditColorScheme},
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  primaryColor: 'redditColorScheme',
  defaultRadius: 'md',
  components: {
    Anchor: {
      defaultProps: {
        underline: 'never'
      }
    }
  }
})

export function ThemeProvider({
  children
}: Readonly<{children: React.ReactNode}>) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="bottom-right" />
      {children}
    </MantineProvider>
  )
}

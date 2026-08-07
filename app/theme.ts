'use client'

import {createTheme, MantineColorsTuple} from '@mantine/core'

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
 * Dark-mode surface palette tuned to sit closer to reddit.com's near-black
 * chrome. Indexes 0-3 (text/dimmed-text shades) match Mantine's default dark
 * tuple; indexes 4-9 (borders, hover, card, body, and beyond) are darkened.
 *
 * @see https://mantine.dev/theming/colors/#override-colors
 */
const redditDarkScheme: MantineColorsTuple = [
  '#C1C2C5',
  '#A6A7AB',
  '#909296',
  '#5c5f66',
  '#343536', // dark.4 -- --mantine-color-default-border
  '#272729', // dark.5 -- --mantine-color-default-hover
  '#1a1a1b', // dark.6 -- --mantine-color-default (cards, pills, panels)
  '#0e0e10', // dark.7 -- --mantine-color-body (page background)
  '#0a0a0b',
  '#050505'
]

/**
 * Mantine theme configuration.
 * Sets up the application's design system with custom colors and defaults.
 *
 * Features:
 * - Reddit orange color scheme
 * - Reddit-style near-black dark mode surfaces
 * - System font stack
 * - Default border radius (md), pill-shaped buttons/action icons (xl)
 * - Anchor component defaults (no underline)
 *
 * @see https://mantine.dev/theming/theme-object/
 */
export const theme = createTheme({
  colors: {redditColorScheme, dark: redditDarkScheme},
  primaryColor: 'redditColorScheme',
  primaryShade: {light: 8, dark: 8}, // WCAG AA compliant contrast ratio for #ff4500
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
  components: {
    Anchor: {
      defaultProps: {
        underline: 'never'
      }
    },
    Button: {
      defaultProps: {
        radius: 'xl'
      }
    },
    ActionIcon: {
      defaultProps: {
        radius: 'xl'
      }
    }
  }
})

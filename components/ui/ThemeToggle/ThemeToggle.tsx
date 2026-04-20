'use client'

import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme
} from '@mantine/core'
import {IconMoon, IconSun} from '@tabler/icons-react'
import styles from './ThemeToggle.module.css'

/** Toggle button for switching between light and dark color schemes. */
export function ThemeToggle() {
  const {setColorScheme} = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true
  })

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      onClick={toggleColorScheme}
      aria-label={
        computedColorScheme === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      data-umami-event="toggle-color-scheme"
      suppressHydrationWarning
    >
      <IconSun className={styles.sun} aria-hidden="true" size={20} />
      <IconMoon className={styles.moon} aria-hidden="true" size={20} />
    </ActionIcon>
  )
}

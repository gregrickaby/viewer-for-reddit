/**
 * Set the dark mode class on the HTML element.
 *
 * @param isDark - Whether to enable dark mode.
 */
export function setDarkMode(isDark: boolean) {
  // Force boolean type.
  isDark = Boolean(isDark)

  // Ensure we're operating on the HTML element.
  const root = document.documentElement

  // Remove first, then add to avoid any class duplication.
  root.classList.remove('dark')
  if (isDark) {
    root.classList.add('dark')
  }
}

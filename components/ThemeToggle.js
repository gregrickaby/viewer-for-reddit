import useDarkMode from 'use-dark-mode'

export default function ThemeToggle() {
  const darkMode = useDarkMode(false)

  return (
    <div className="theme-toggle-wrap">
      <label className="theme-toggle" htmlFor="checkbox">
        <span className="sr-only">Toggle dark mode</span>
        <input
          aria-label="Toggle dark mode"
          checked={darkMode.value}
          id="checkbox"
          name="checkbox"
          onChange={darkMode.toggle}
          type="checkbox"
        />
        <div className="theme-toggle-slider"></div>
      </label>
      <span className="theme-toggle-icon">☾</span>
    </div>
  )
}

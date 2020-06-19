import useDarkMode from 'use-dark-mode'

const ThemeToggle = () => {
  const darkMode = useDarkMode(false)

  return (
    <div className="theme-toggle-wrap">
      <label className="theme-toggle" htmlFor="checkbox">
        <input
          checked={darkMode.value}
          id="checkbox"
          onChange={darkMode.toggle}
          type="checkbox"
        />
        <div className="theme-toggle-slider"></div>
      </label>
      <span className="theme-toggle-icon">☾</span>
    </div>
  )
}

export default ThemeToggle

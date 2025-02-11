import type { UserSettings } from '../types/settings'

// Constant key used for localStorage to store settings.
// Using a consistent key ensures that all parts of the app refer to the same settings.
const STORAGE_KEY = 'redditViewer'

/**
 * Retrieves the initial default settings for a new user.
 *
 * These settings include default preferences such as:
 * - The initial subreddit ('aww') and sort order ('hot').
 * - Whether dark mode is enabled (based on the user's system preference).
 * - Various UI state toggles (like showing settings, search, and about panels).
 *
 * Modal states (showAbout, showRecent, showSearch, showSettings) are always set to false.
 *
 * @returns {UserSettings} The default settings object.
 */
export function getInitialSettings(): UserSettings {
  return {
    currentSort: 'hot',
    currentSubreddit: 'aww',
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    enableNsfw: true,
    isAppLoading: true,
    isMuted: true,
    likedPosts: {},
    recentSubreddits: [],
    showAbout: false,
    showRecent: false,
    showSearch: false,
    showSettings: false
  }
}

/**
 * Filters out modal state keys from the saved settings object.
 *
 * This function creates a shallow copy of the provided settings object and
 * deletes the keys that correspond to modal visibility. This ensures that transient
 * UI state for modals is not persisted between sessions.
 *
 * @param {Partial<UserSettings>} settings - The settings object to filter.
 * @returns {Partial<UserSettings>} A new settings object without the modal state keys.
 */
function filterModalKeys(
  settings: Partial<UserSettings>
): Partial<UserSettings> {
  const copy = { ...settings }
  delete copy.showAbout
  delete copy.showRecent
  delete copy.showSearch
  delete copy.showSettings
  return copy
}

/**
 * Loads user settings from localStorage.
 *
 * If no settings are found, the function returns the default settings.
 * If settings are found, they are merged with the default settings to ensure all keys are present.
 * The modal state keys are explicitly removed so that transient UI state is not persisted between sessions.
 *
 * @returns {UserSettings} The merged user settings object with modal keys reset.
 */
export function loadSettings(): UserSettings {
  try {
    // Retrieve the saved settings from localStorage.
    const saved = localStorage.getItem(STORAGE_KEY)

    // If no settings have been saved, return the initial defaults.
    if (!saved) {
      return getInitialSettings()
    }

    // Parse the saved JSON string.
    const parsed = JSON.parse(saved) as Partial<UserSettings>

    // Remove any persisted modal state values.
    const filteredSettings = filterModalKeys(parsed)

    // Merge default settings with the filtered saved settings.
    // Saved settings will override the defaults, ensuring all keys exist.
    return { ...getInitialSettings(), ...filteredSettings }
  } catch (error) {
    console.error('Failed to load settings:', error)
    // In case of an error (e.g., corrupted JSON), return the defaults.
    return getInitialSettings()
  }
}

/**
 * Saves the current user settings to localStorage.
 *
 * Converts the settings object to a JSON string and stores it under the designated key.
 * Errors are caught and logged to prevent the app from crashing.
 *
 * Note: Even if modal state values are present in the settings, they will be ignored on load.
 *
 * @param {UserSettings} settings - The user settings to save.
 */
export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

/**
 * Clears all saved user settings from localStorage.
 *
 * This is typically used when resetting the app to its default state.
 */
export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear settings:', error)
  }
}

import type {UserSettings} from '@/lib/types'

// Constant key used for localStorage to store settings.
// Using a consistent key ensures that all parts of the app refer to the same settings.
const STORAGE_KEY = 'redditViewer'

/**
 * Check if the code is running in a browser environment
 * This prevents errors during server-side rendering
 */
function isBrowser() {
  return typeof window !== 'undefined'
}

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
    currentSubreddit: '',
    enableNsfw: true,
    favorites: [],
    isMuted: true,
    recent: []
  }
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
    // Check if running in a browser environment
    if (!isBrowser()) {
      return getInitialSettings()
    }

    // Retrieve the saved settings from localStorage.
    const saved = localStorage.getItem(STORAGE_KEY)

    // If no settings have been saved, return the initial defaults.
    if (!saved) {
      return getInitialSettings()
    }

    // Parse the saved JSON string.
    const settings = JSON.parse(saved) as Partial<UserSettings>

    // Merge the saved settings with the defaults.
    return {...getInitialSettings(), ...settings}
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
    // Only attempt to save if in browser environment
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
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
    // Only attempt to clear if in browser environment
    if (isBrowser()) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.error('Failed to clear settings:', error)
  }
}

import type {UserSettings} from '@/lib/types'

const STORAGE_KEY = 'redditViewer'

/**
 * Check if the code is running in a browser environment.
 *
 * This prevents errors during server-side rendering by ensuring localStorage
 * operations only occur in browser contexts where localStorage is available.
 *
 * @returns True if running in browser with window object available
 *
 * @internal This is a private helper function for SSR safety
 */
function isBrowser() {
  return globalThis.window !== undefined
}

/**
 * Retrieves the initial default settings for a new user.
 *
 * Provides sensible defaults for all user settings including sorting preferences,
 * NSFW content visibility, and empty collections for favorites and history.
 *
 * @returns The default settings object with all required properties
 *
 * @example
 * ```typescript
 * const defaults = getInitialSettings()
 * // Returns: { currentSort: 'hot', enableNsfw: true, favorites: [], ... }
 * ```
 */
export function getInitialSettings(): UserSettings {
  return {
    commentSort: 'best',
    currentSort: 'hot',
    currentSubreddit: '',
    enableNsfw: true,
    favorites: [],
    isMuted: true,
    recent: [],
    searchHistory: []
  }
}

/**
 * Loads user settings from localStorage with SSR safety and error handling.
 *
 * Safely retrieves user settings from browser localStorage with comprehensive
 * error handling. If no settings exist or parsing fails, returns sensible defaults.
 * Merges saved settings with defaults to ensure all required properties exist.
 *
 * @returns The complete user settings object with all required properties
 *
 * @example
 * ```typescript
 * const settings = loadSettings()
 * // Always returns valid UserSettings object, never null/undefined
 * ```
 *
 * @throws Never throws - handles all errors gracefully with fallbacks
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
 * Saves the current user settings to localStorage with error handling.
 *
 * Safely persists user settings to browser localStorage with SSR protection.
 * Serializes the settings object to JSON and handles storage quota errors gracefully.
 * Only operates in browser environments to prevent SSR issues.
 *
 * @param settings - The complete user settings object to persist
 *
 * @example
 * ```typescript
 * const updatedSettings = { ...currentSettings, enableNsfw: false }
 * saveSettings(updatedSettings)
 * ```
 *
 * @throws Never throws - handles localStorage errors gracefully with logging
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
 * Completely removes the stored settings from browser localStorage, effectively
 * resetting the user's preferences to defaults. Used when users explicitly
 * request to reset all settings or clear their data.
 *
 * @example
 * ```typescript
 * clearSettings()
 * // Next call to loadSettings() will return initial defaults
 * ```
 *
 * @throws Never throws - handles localStorage errors gracefully with logging
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

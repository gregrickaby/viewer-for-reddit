import { useMemo } from 'react'
import {
  resetSettings,
  setSortingOption,
  toggleAbout,
  toggleDarkMode,
  toggleNsfw,
  toggleSettings
} from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { RootState } from '../store/store'
import type { SortingOption } from '../types/settings'

/**
 * Settings Component
 */
export default function Settings() {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get current settings from Redux store.
  const { darkMode, currentSort, enableNsfw } = useAppSelector(
    (state: RootState) => state.settings
  )

  // Sort options.
  const sortOptions = useMemo<SortingOption[]>(
    () => ['hot', 'new', 'top', 'latest'],
    []
  )

  return (
    <div className="space-y-6">
      {/* Dark mode toggle. */}
      <div className="flex items-center justify-between">
        <span>Enable Dark Mode</span>
        <button
          aria-label="Toggle dark mode"
          aria-pressed={darkMode}
          onClick={() => dispatch(toggleDarkMode())}
          className={`${
            darkMode ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-500'
          } relative inline-flex h-6 w-11 rounded-full transition-colors`}
        >
          <span
            className={`${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            } mt-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {/* NSFW content toggle. */}
      <div className="flex items-center justify-between">
        <span>Allow NSFW Content</span>
        <button
          aria-label="Toggle NSFW content"
          aria-pressed={enableNsfw}
          className={`${
            enableNsfw ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-500'
          } relative inline-flex h-6 w-11 rounded-full transition-colors`}
          onClick={() => dispatch(toggleNsfw())}
        >
          <span
            className={`${
              enableNsfw ? 'translate-x-6' : 'translate-x-1'
            } mt-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {/* Sort options dropdown. */}
      <div className="space-y-2">
        <label htmlFor="sort-select" className="block">
          Sort Posts
        </label>
        <select
          className="w-full rounded border p-2 dark:border-zinc-600 dark:bg-zinc-700"
          id="sort-select"
          value={currentSort}
          onChange={(e) =>
            dispatch(setSortingOption(e.target.value as SortingOption))
          }
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons. */}
      <div className="flex flex-col gap-4 border-t pt-4">
        <button
          aria-label="Save settings"
          className="flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => {
            dispatch(toggleSettings())
          }}
        >
          Save
        </button>

        <button
          aria-label="Reset all settings"
          className="flex-1 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          onClick={() => {
            if (confirm('Are you sure? This will clear all your settings!')) {
              dispatch(resetSettings())
              dispatch(toggleSettings())
            }
          }}
        >
          Reset
        </button>

        <button
          aria-label="View About"
          className="text-center text-white"
          onClick={() => {
            dispatch(toggleAbout())
          }}
        >
          About
        </button>
      </div>
    </div>
  )
}

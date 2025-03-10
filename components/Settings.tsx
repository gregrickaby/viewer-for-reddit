'use client'

import {
  resetSettings,
  setSortingOption,
  toggleNsfw
} from '@/lib/features/settingsSlice'
import { toggleAbout, toggleSettings } from '@/lib/features/transientSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { RootState } from '@/lib/store'
import type { SortingOption } from '@/types/settings'
import clsx from 'clsx'
import { useMemo } from 'react'

/**
 * Settings Component
 */
export default function Settings() {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get current settings from Redux store.
  const { currentSort, enableNsfw } = useAppSelector(
    (state: RootState) => state.settings
  )

  // Sort options.
  const sortOptions = useMemo<SortingOption[]>(
    () => ['hot', 'new', 'top', 'latest'],
    []
  )

  return (
    <div className="space-y-6">
      {/* NSFW content toggle. */}
      <div className="flex items-center justify-between">
        <span>Allow NSFW Content</span>
        <button
          aria-label="Toggle NSFW content"
          aria-pressed={enableNsfw}
          className={clsx(
            'relative inline-flex h-6 w-11 rounded-full transition-colors hover:cursor-pointer',
            enableNsfw ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-500'
          )}
          onClick={() => dispatch(toggleNsfw())}
        >
          <span
            className={clsx(
              'mt-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              enableNsfw ? 'translate-x-6' : 'translate-x-1'
            )}
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
          className="flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-blue-700"
          onClick={() => {
            dispatch(toggleSettings())
          }}
        >
          Save
        </button>

        <button
          aria-label="Reset all settings"
          className="flex-1 rounded bg-red-400 px-4 py-2 text-white hover:cursor-pointer hover:bg-red-600"
          onClick={() => {
            if (confirm('Are you sure? This will clear all your settings!')) {
              dispatch(resetSettings())
              dispatch(toggleSettings())
            }
          }}
        >
          Reset all settings and clear history
        </button>

        <button
          aria-label="View About"
          className="text-center font-bold underline hover:cursor-pointer"
          onClick={() => {
            dispatch(toggleAbout())
          }}
        >
          About Reddit Viewer
        </button>
      </div>
    </div>
  )
}

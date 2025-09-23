import type {RootState} from '@/lib/store'
import type {SubredditItem} from '@/lib/types'
import {createSelector} from '@reduxjs/toolkit'

/**
 * Base selector to get the settings state
 */
export const selectSettings = (state: RootState) => state.settings

/**
 * Selector to get favorite subreddit display names as an array of strings
 */
export const selectFavoriteSubreddits = createSelector(
  [selectSettings],
  (settings) => settings.favorites.map((sub: SubredditItem) => sub.display_name)
)

/**
 * Selector to check if user has any favorite subreddits
 */
export const selectHasFavorites = createSelector(
  [selectFavoriteSubreddits],
  (favoriteNames) => favoriteNames.length > 0
)

/**
 * Selector to get recent subreddit display names as an array of strings
 */
export const selectRecentSubreddits = createSelector(
  [selectSettings],
  (settings) => settings.recent.map((sub: SubredditItem) => sub.display_name)
)

/**
 * Selector to check if user has any recent subreddits
 */
export const selectHasRecent = createSelector(
  [selectRecentSubreddits],
  (recentNames) => recentNames.length > 0
)

/**
 * Selector to get search history as an array of SubredditItem objects
 */
export const selectSearchHistory = createSelector(
  [selectSettings],
  (settings) => settings.searchHistory
)

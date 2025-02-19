import { clearRecent } from '../store/features/settingsSlice'
import { toggleRecent, toggleSearch } from '../store/features/transientSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { SubredditItem } from './SubredditItem'

/**
 * Recent component.
 */
export default function Recent() {
  // Get the dispatch function from the store.
  const dispatch = useAppDispatch()

  // Get the recent subreddits from the store.
  const recent = useAppSelector((state) => state.settings.recent)

  // Display a message if there are no recent subreddits.
  if (recent.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 text-center text-zinc-500">
        You don't have any viewing history yet.
        <button
          aria-label="Search for subreddits"
          className="mt-8 flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => {
            dispatch(toggleSearch())
          }}
        >
          Search for Subreddits
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {recent.map((subreddit) => (
        <SubredditItem
          key={subreddit.display_name}
          listType="recent"
          subreddit={subreddit}
        />
      ))}

      <button
        aria-label="Clear recent history"
        className="mt-8 flex-1 rounded bg-red-400 px-4 py-2 text-white hover:bg-red-600"
        onClick={() => {
          if (confirm('Are you sure? This will clear your viewing history!')) {
            dispatch(clearRecent())
            dispatch(toggleRecent())
          }
        }}
      >
        Clear Viewing History
      </button>
    </div>
  )
}

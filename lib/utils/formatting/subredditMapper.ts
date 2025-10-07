import type {SubredditItem} from '@/lib/types'
import type {components} from '@/lib/types/reddit-api'

// Auto-generated type for subreddit about data
type AutoAboutData = NonNullable<
  components['schemas']['GetSubredditAboutResponse']['data']
>

// Auto-generated type for popular subreddit child data
type AutoPopularChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['GetPopularSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

// Auto-generated type for search subreddit child data
type AutoSearchChildData = NonNullable<
  NonNullable<
    NonNullable<
      components['schemas']['SearchSubredditsResponse']['data']
    >['children']
  >[number]['data']
>

/**
 * Creates a standardized SubredditItem from common subreddit data properties.
 *
 * Internal helper function that normalizes subreddit data from different Reddit API
 * endpoints into a consistent SubredditItem format. Handles optional properties
 * with sensible defaults and formats the value with the 'r/' prefix.
 *
 * @param input - Raw subreddit data with common properties
 * @returns Standardized SubredditItem object
 *
 * @internal This is a private helper function for subreddit mapping
 */
function baseSubredditItem(input: {
  display_name?: string
  icon_img?: string
  over18?: boolean
  subscribers?: number
  public_description?: string
}): SubredditItem {
  const name = input.display_name ?? ''
  return {
    display_name: name,
    icon_img: input.icon_img,
    over18: input.over18 ?? false,
    value: `r/${name}`,
    subscribers: input.subscribers ?? 0,
    public_description: input.public_description ?? ''
  }
}

/**
 * Maps search API response data to a SubredditItem.
 *
 * Converts subreddit data from Reddit's search API into the standardized
 * SubredditItem format.
 *
 * @param sub - Subreddit data from search API response
 * @returns SubredditItem object
 *
 * @example
 * ```typescript
 * const searchResult = { display_name: 'javascript', subscribers: 50000 }
 * const item = fromSearch(searchResult)
 * // Returns: { display_name: 'javascript', value: 'r/javascript', ... }
 * ```
 */
export const fromSearch = (sub: AutoSearchChildData): SubredditItem =>
  baseSubredditItem(sub)

/**
 * Maps popular subreddits API response data to a SubredditItem.
 *
 * Converts subreddit data from Reddit's popular subreddits API into the
 * standardized SubredditItem format.
 *
 * @param sub - Subreddit data from popular subreddits API response
 * @returns SubredditItem object
 *
 * @example
 * ```typescript
 * const popularSub = { display_name: 'programming', subscribers: 100000 }
 * const item = fromPopular(popularSub)
 * // Returns: { display_name: 'programming', value: 'r/programming', ... }
 * ```
 */
export const fromPopular = (sub: AutoPopularChildData): SubredditItem =>
  baseSubredditItem(sub)

/**
 * Maps subreddit about API response data to a SubredditItem.
 *
 * Converts subreddit data from Reddit's subreddit about API into the
 * standardized SubredditItem format. Used when fetching detailed information
 * about a specific subreddit.
 *
 * @param sub - Subreddit data from about API response
 * @returns SubredditItem object
 *
 * @example
 * ```typescript
 * const aboutData = { display_name: 'reactjs', subscribers: 75000, public_description: 'React.js community' }
 * const item = fromAbout(aboutData)
 * // Returns: { display_name: 'reactjs', value: 'r/reactjs', public_description: 'React.js community', ... }
 * ```
 */
export const fromAbout = (sub: AutoAboutData): SubredditItem =>
  baseSubredditItem(sub)

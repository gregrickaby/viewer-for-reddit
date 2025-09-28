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

export const fromSearch = (sub: AutoSearchChildData): SubredditItem => ({
  ...baseSubredditItem(sub),
  fromSearch: true
})

export const fromPopular = (sub: AutoPopularChildData): SubredditItem =>
  baseSubredditItem(sub)

export const fromAbout = (sub: AutoAboutData): SubredditItem =>
  baseSubredditItem(sub)

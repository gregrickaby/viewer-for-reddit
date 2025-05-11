import type {SubredditItem} from '@/lib/types'
import type {AboutResponseData} from '@/lib/types/about'
import type {PopularChildData} from '@/lib/types/popular'
import type {SearchChildData} from '@/lib/types/search'

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

export const fromSearch = (sub: SearchChildData): SubredditItem =>
  baseSubredditItem(sub)

export const fromPopular = (sub: PopularChildData): SubredditItem =>
  baseSubredditItem(sub)

export const fromAbout = (sub: AboutResponseData): SubredditItem =>
  baseSubredditItem(sub)

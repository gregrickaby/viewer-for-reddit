import 'server-only'
import { resolveMedia } from '@/lib/media/detect'
import type { PostView } from '@/lib/view-models'
import { sanitizeRedditHtml } from '../sanitize'
import { type RedditLink, crosspostParent } from '../schemas/link'
import {
  appPath,
  authorName,
  distinguishedFrom,
  editedAt,
  flairFrom,
  removalFrom,
  toVote,
} from './shared'

export function mapPost(link: RedditLink): PostView {
  const parent = crosspostParent(link)
  const removal = removalFrom(link.removed_by_category)

  return {
    id: link.id,
    fullname: `t3_${link.id}`,
    subreddit: link.subreddit,
    author: authorName(link.author),
    title: link.title,
    permalink: postPath(link),
    createdUtc: link.created_utc,
    editedUtc: editedAt(link.edited),
    score: link.score,
    hideScore: link.hide_score,
    likes: toVote(link.likes),
    numComments: link.num_comments,
    saved: link.saved,
    flags: {
      nsfw: link.over_18,
      spoiler: link.spoiler,
      stickied: link.stickied,
      locked: link.locked,
      archived: link.archived,
    },
    distinguished: distinguishedFrom(link.distinguished),
    removal,
    flair: flairFrom(
      link.link_flair_text,
      link.link_flair_background_color,
      link.link_flair_text_color,
    ),
    body: removal ? null : postBody(link, parent),
    media: resolveMedia(link),
    crosspostFrom: parent
      ? {
          subreddit: parent.subreddit,
          author: authorName(parent.author),
          permalink: postPath(parent),
        }
      : null,
  }
}

function postPath(link: RedditLink): string {
  return appPath(link.permalink, `/r/${link.subreddit}/comments/${link.id}`)
}

/** Self text, with inline media; a crosspost of a text post borrows the original's. */
function postBody(link: RedditLink, parent: RedditLink | null) {
  const source = link.selftext_html ? link : parent
  return sanitizeRedditHtml(source?.selftext_html, {
    inlineMedia: { metadata: source?.media_metadata },
  })
}

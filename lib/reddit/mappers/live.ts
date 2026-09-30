import 'server-only'
import type { LiveEventView, LiveUpdateView } from '@/lib/view-models'
import { sanitizeRedditHtml } from '../sanitize'
import type { RedditLiveEvent, RedditLiveUpdate } from '../schemas/live'
import { authorName } from './shared'

export function mapLiveEvent(event: RedditLiveEvent): LiveEventView {
  return {
    id: event.id,
    title: event.title,
    description: sanitizeRedditHtml(event.description_html),
    resources: sanitizeRedditHtml(event.resources_html),
    live: event.state === 'live',
    viewers: event.viewer_count ?? null,
    nsfw: event.nsfw,
    createdUtc: event.created_utc,
  }
}

export function mapLiveUpdate(update: RedditLiveUpdate): LiveUpdateView {
  return {
    name: update.name,
    author: update.author ? authorName(update.author) : null,
    body: sanitizeRedditHtml(update.body_html),
    createdUtc: update.created_utc,
    stricken: update.stricken,
  }
}

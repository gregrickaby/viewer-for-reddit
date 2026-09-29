import 'server-only'
import type { Distinguished, FlairView, Removal, Vote } from '@/lib/view-models'
import { resolveRedditLink } from '../links'

/** Reddit's `likes`: true → 1, false → -1, null → 0. */
export function toVote(likes: boolean | null | undefined): Vote {
  return likes === true ? 1 : likes === false ? -1 : 0
}

/** `edited` is `false` or the edit time in seconds (rarely a bare `true`, which has no time). */
export function editedAt(edited: boolean | number): number | null {
  return typeof edited === 'number' ? edited : null
}

/** Deleted accounts show as `[deleted]`. */
export function authorName(author: string): string | null {
  return author === '[deleted]' ? null : author
}

/** `removed_by_category` is `deleted` when the author did it; anything else means removed. */
export function removalFrom(category: string | null | undefined): Removal | null {
  if (!category) return null
  return category === 'deleted' ? 'deleted' : 'removed'
}

export function distinguishedFrom(value: string | null | undefined): Distinguished {
  return value === 'moderator' || value === 'admin' ? value : null
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** A color safe to put in a style attribute, or null. Reddit sends `""` for "none". */
export function hexColor(value: string | null | undefined): string | null {
  return value && HEX_COLOR.test(value) ? value : null
}

export function flairFrom(
  text: string | null | undefined,
  background: string | null | undefined,
  textColor: string | null | undefined,
): FlairView | null {
  const trimmed = text?.trim()
  if (!trimmed) return null
  return {
    text: trimmed,
    backgroundColor: hexColor(background),
    textColor: textColor === 'light' ? 'light' : 'dark',
  }
}

/** Reddit's permalink as an app route, or `fallback` when it isn't one we render. */
export function appPath(permalink: string | undefined, fallback: string): string {
  const resolved = permalink ? resolveRedditLink(permalink) : null
  return resolved?.internal ? resolved.href : fallback
}

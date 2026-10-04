import 'server-only'
import { safeMediaUrl } from '@/lib/media/url'
import type { Distinguished, FlairPart, FlairView, Removal, Vote } from '@/lib/view-models'
import { resolveRedditLink } from '../links'
import type { FlairRichtext } from '../schemas/generated'

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

/**
 * Reddit's rich flair: text runs and emoji images. An emoji whose image isn't a Reddit
 * media URL stays as its `:name:` text.
 */
function flairParts(richtext: readonly FlairRichtext[]): FlairPart[] {
  return richtext.flatMap((part): FlairPart[] => {
    if (part.e === 'emoji' && part.a) {
      const src = safeMediaUrl(part.u)
      const name = part.a.replace(/^:|:$/g, '')
      return src && name ? [{ kind: 'emoji', name, src }] : [{ kind: 'text', text: part.a }]
    }
    return part.e === 'text' && part.t ? [{ kind: 'text', text: part.t }] : []
  })
}

/** Trims the flair as a whole: the outer text runs, not the spaces between parts. */
function trimParts(parts: FlairPart[]): FlairPart[] {
  const trimmed = parts.map((part, index) => {
    if (part.kind !== 'text') return part
    let text = part.text
    if (index === 0) text = text.trimStart()
    if (index === parts.length - 1) text = text.trimEnd()
    return { ...part, text }
  })
  return trimmed.filter((part) => part.kind !== 'text' || part.text !== '')
}

export function flairFrom(
  text: string | null | undefined,
  background: string | null | undefined,
  textColor: string | null | undefined,
  richtext?: readonly FlairRichtext[] | null,
): FlairView | null {
  const rich = trimParts(flairParts(richtext ?? []))
  const trimmed = text?.trim()
  const parts: FlairPart[] =
    rich.length > 0 ? rich : trimmed ? [{ kind: 'text', text: trimmed }] : []
  if (parts.length === 0) return null
  return {
    text:
      trimmed ||
      parts.map((part) => (part.kind === 'text' ? part.text : `:${part.name}:`)).join(''),
    parts,
    backgroundColor: hexColor(background),
    textColor: textColor === 'light' ? 'light' : 'dark',
  }
}

/** Reddit's permalink as an app route, or `fallback` when it isn't one we render. */
export function appPath(permalink: string | undefined, fallback: string): string {
  const resolved = permalink ? resolveRedditLink(permalink) : null
  return resolved?.internal ? resolved.href : fallback
}

import 'server-only'
import sanitizeHtml from 'sanitize-html'
import type { SafeHtml } from '@/lib/view-models'
import { resolveRedditLink } from './links'

/*
 * The only producer of `SafeHtml` (docs/design.md §7, §8.9). Reddit's own
 * markdown-to-HTML output (`selftext_html` / `body_html`, fetched with raw_json=1)
 * is reduced to a strict allowlist, links are rewritten to app routes, and
 * spoilers are made keyboard accessible.
 */

const ALIGNMENTS = new Set(['left', 'center', 'right'])

/** Keep `align` only when it is a known value (sanitize-html would leave a bare `align`). */
type Attributes = sanitizeHtml.Attributes

/** Keep `align` only when it is a known value (sanitize-html would leave a bare `align`). */
const alignedCell: sanitizeHtml.Transformer = (tagName, attribs) => {
  const kept: Attributes = {}
  if (attribs.align && ALIGNMENTS.has(attribs.align)) kept.align = attribs.align
  return { tagName, attribs: kept }
}

/** Internal links stay in-app; external ones open safely in a new tab; unsafe ones lose the link. */
const rewriteLink: sanitizeHtml.Transformer = (tagName, attribs) => {
  const resolved = attribs.href ? resolveRedditLink(attribs.href) : null
  if (!resolved) return { tagName: 'span', attribs: {} }
  const kept: Attributes = { href: resolved.href }
  if (!resolved.internal) {
    kept.target = '_blank'
    kept.rel = 'noopener noreferrer nofollow ugc'
  }
  return { tagName, attribs: kept }
}

/** Reddit spoilers (`>!text!<`) become focusable so keyboard users can reveal them. */
const spoiler: sanitizeHtml.Transformer = (tagName, attribs) => {
  const isSpoiler = attribs.class?.split(/\s+/).includes('md-spoiler-text') ?? false
  const kept: Attributes = isSpoiler
    ? {
        class: 'md-spoiler-text',
        tabindex: '0',
        role: 'button',
        'aria-label': 'Spoiler, activate to reveal',
      }
    : {}
  return { tagName, attribs: kept }
}

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'em',
    'strong',
    'del',
    'sup',
    'sub',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    th: ['align'],
    td: ['align'],
    span: ['class', 'tabindex', 'role', 'aria-label'],
    ol: ['start'],
  },
  allowedClasses: { span: ['md-spoiler-text'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  // Unknown tags (e.g. Reddit's wrapping <div class="md">) are dropped, but their text is kept.
  disallowedTagsMode: 'discard',
  transformTags: {
    th: alignedCell,
    td: alignedCell,
    a: rewriteLink,
    span: spoiler,
  },
}

export function sanitizeRedditHtml(html: string | null | undefined): SafeHtml | null {
  if (!html) return null
  const clean = sanitizeHtml(html, OPTIONS).trim()
  return clean === '' ? null : (clean as SafeHtml)
}

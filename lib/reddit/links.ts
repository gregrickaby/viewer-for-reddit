import 'server-only'

/*
 * Maps Reddit URLs onto this app's routes (docs/design.md §9). Anything we don't
 * render ourselves stays an absolute reddit.com link.
 */

const REDDIT_HOSTS = new Set([
  'reddit.com',
  'www.reddit.com',
  'old.reddit.com',
  'new.reddit.com',
  'np.reddit.com',
  'm.reddit.com',
  'sh.reddit.com',
])

const NAME = '[A-Za-z0-9_-]{1,50}'

/** Path shapes the app renders, normalized to our route segments. */
const INTERNAL_ROUTES: Array<[pattern: RegExp, toPath: (m: RegExpExecArray) => string]> = [
  [
    new RegExp(`^/r/(${NAME})/comments/([a-z0-9]+)(?:/([^/]*))?(?:/([a-z0-9]+))?/?$`, 'i'),
    (m) => ['/r', m[1], 'comments', m[2], m[3], m[4]].filter(Boolean).join('/'),
  ],
  [new RegExp(`^/(?:u|user)/(${NAME})/m/(${NAME})/?$`, 'i'), (m) => `/user/${m[1]}/m/${m[2]}`],
  [new RegExp(`^/(?:u|user)/(${NAME})/?$`, 'i'), (m) => `/user/${m[1]}`],
  [new RegExp(`^/r/(${NAME})/?$`, 'i'), (m) => `/r/${m[1]}`],
]

export type ResolvedLink = { href: string; internal: boolean }

/**
 * Resolve an href from Reddit content. Relative links (`/r/foo`) are relative to reddit.com.
 * Returns null for anything that isn't a safe http(s) or mailto URL.
 */
export function resolveRedditLink(href: string): ResolvedLink | null {
  let url: URL
  try {
    url = new URL(href.trim(), 'https://www.reddit.com')
  } catch {
    return null
  }

  if (url.protocol === 'mailto:') return { href: url.href, internal: false }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  if (REDDIT_HOSTS.has(url.hostname.toLowerCase())) {
    for (const [pattern, toPath] of INTERNAL_ROUTES) {
      const match = pattern.exec(url.pathname)
      if (match) return { href: `${toPath(match)}${url.search}${url.hash}`, internal: true }
    }
    url.protocol = 'https:'
    url.hostname = 'www.reddit.com'
  }

  return { href: url.href, internal: false }
}

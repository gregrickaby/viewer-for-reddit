import 'server-only'

/**
 * Accept a post-login redirect target only if it is a same-origin relative path.
 * Anything else (absolute URLs, protocol-relative `//host`, backslash tricks,
 * encoded variants) falls back, preventing open redirects (docs/design.md §5.3).
 */
export function safeNext(value: string | null | undefined, fallback = '/home'): string {
  if (!value) return fallback

  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return fallback
  }

  for (const candidate of [value, decoded]) {
    if (
      !candidate.startsWith('/') ||
      candidate.startsWith('//') ||
      candidate.includes('\\') ||
      // Control characters can be normalized away by browsers into `//`.
      /[\u0000-\u001f\u007f]/.test(candidate)
    ) {
      return fallback
    }
  }

  // Resolve against a dummy origin: the result must stay on that origin.
  const url = new URL(value, 'https://app.invalid')
  if (url.origin !== 'https://app.invalid') return fallback

  return `${url.pathname}${url.search}${url.hash}`
}

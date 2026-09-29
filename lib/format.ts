/*
 * Display formatting. Pure and dependency-free, so islands may use it too.
 */

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Reddit-style counts: 950, 1.2k, 34k, 1.5m. */
export function compactNumber(value: number): string {
  return Math.abs(value) < 1000 ? String(value) : compact.format(value).toLowerCase()
}

const UNITS: Array<[limit: number, seconds: number, suffix: string]> = [
  [60 * 60, 60, 'm'],
  [60 * 60 * 24, 60 * 60, 'h'],
  [60 * 60 * 24 * 30, 60 * 60 * 24, 'd'],
  [60 * 60 * 24 * 365, 60 * 60 * 24 * 30, 'mo'],
  [Number.POSITIVE_INFINITY, 60 * 60 * 24 * 365, 'y'],
]

/** Short relative age, like Reddit's: now, 5m, 3h, 2d, 4mo, 2y. */
export function timeAgo(utcSeconds: number, nowMs: number): string {
  const elapsed = Math.max(0, Math.floor(nowMs / 1000 - utcSeconds))
  if (elapsed < 60) return 'now'
  const [, seconds, suffix] = UNITS.find(([limit]) => elapsed < limit)!
  return `${Math.floor(elapsed / seconds)}${suffix}`
}

const absolute = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

/** A full timestamp for tooltips. The server doesn't know the viewer's time zone, so it's UTC. */
export function absoluteTime(utcSeconds: number): string {
  return `${absolute.format(utcSeconds * 1000)} UTC`
}

export function isoTime(utcSeconds: number): string {
  return new Date(utcSeconds * 1000).toISOString()
}

/** "1 comment", "2.3k comments". */
export function plural(count: number, noun: string): string {
  return `${compactNumber(count)} ${noun}${count === 1 ? '' : 's'}`
}

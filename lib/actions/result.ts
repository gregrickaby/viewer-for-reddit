/*
 * What every Server Action returns (design §8.2). Types only, so islands can
 * import it.
 */

export type ActionErrorCode =
  'INVALID' | 'RATE_LIMITED' | 'FORBIDDEN' | 'NOT_FOUND' | 'UNAVAILABLE' | 'REDDIT' | 'UNKNOWN'

export type ActionError = { code: ActionErrorCode; message: string }

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError }

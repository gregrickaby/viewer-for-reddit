/*
 * What every Server Action returns. Types only, so islands can
 * import it.
 */

export type ActionErrorCode =
  'INVALID' | 'RATE_LIMITED' | 'FORBIDDEN' | 'NOT_FOUND' | 'UNAVAILABLE' | 'REDDIT' | 'UNKNOWN'

export interface ActionError {
  code: ActionErrorCode
  message: string
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError }

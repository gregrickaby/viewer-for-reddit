import type { ActionResult } from './result'

export type ServerAction<T> = (formData: FormData) => Promise<ActionResult<T>>

/**
 * A Server Action typed as a form `action`. A form ignores the return value
 * (without JS the page simply re-renders), and the function itself is passed
 * through unchanged so Next can still post it before hydration. Usable from
 * Server and Client Components alike.
 */
export function formAction<T>(action: ServerAction<T>): (formData: FormData) => Promise<void> {
  return action as unknown as (formData: FormData) => Promise<void>
}

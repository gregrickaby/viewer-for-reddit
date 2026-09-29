import 'server-only'
import { io } from 'next/cache'

/**
 * The current time for this request, for relative ages ("3h"). `io()` keeps
 * the clock read out of the prerendered shell (bundled docs: 04-functions/io.md).
 */
export async function requestTime(): Promise<number> {
  await io()
  return Date.now()
}

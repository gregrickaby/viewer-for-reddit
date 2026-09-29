'use server'

import { refresh } from 'next/cache'
import { invalid, runAction } from '@/lib/actions/run-action'
import type { ActionResult } from '@/lib/actions/result'
import { isSubredditName, isUsername } from '@/lib/reddit/names'
import { setSubscription as setRedditSubscription } from '@/lib/reddit/writes'

/**
 * Join or leave a community, or follow or unfollow a person (design §8.2).
 * Re-renders, so the sidebar and every button settle on Reddit's state.
 */
export async function setSubscription(
  formData: FormData,
): Promise<ActionResult<{ subscribed: boolean }>> {
  const name = String(formData.get('name') ?? '')
  const kind = formData.get('kind')
  const subscribe = formData.get('subscribe')
  if (subscribe !== 'true' && subscribe !== 'false') return invalid()
  if (kind === 'community' ? !isSubredditName(name) : kind !== 'user' || !isUsername(name)) {
    return invalid()
  }

  return runAction(async () => {
    await setRedditSubscription(kind === 'user' ? `u_${name}` : name, subscribe === 'true')
    refresh()
    return { subscribed: subscribe === 'true' }
  })
}

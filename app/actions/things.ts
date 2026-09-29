'use server'

import { invalid, runAction } from '@/lib/actions/run-action'
import type { ActionResult } from '@/lib/actions/result'
import { isVotableFullname } from '@/lib/reddit/names'
import { castVote, saveThing } from '@/lib/reddit/writes'
import type { Vote } from '@/lib/view-models'

/*
 * Votes and saves (design §8.2): no re-render. The island commits its own
 * confirmed state, and the next navigation shows Reddit's truth.
 */

const VOTES: Record<string, Vote> = { '1': 1, '0': 0, '-1': -1 }

/**
 * `target` is the arrow that was pressed and `current` the vote the page showed,
 * so the same form works with and without JavaScript: pressing the active
 * arrow clears the vote.
 */
export async function vote(formData: FormData): Promise<ActionResult<{ likes: Vote }>> {
  const id = String(formData.get('id') ?? '')
  const target = VOTES[String(formData.get('target'))]
  const current = VOTES[String(formData.get('current'))]
  if (!isVotableFullname(id) || !target || current === undefined) return invalid()

  const likes: Vote = current === target ? 0 : target
  return runAction(async () => {
    await castVote(id, likes)
    return { likes }
  })
}

/** `saved` is the state to set, as `"true"` or `"false"`. */
export async function setSaved(formData: FormData): Promise<ActionResult<{ saved: boolean }>> {
  const id = String(formData.get('id') ?? '')
  const saved = formData.get('saved')
  if (!isVotableFullname(id) || (saved !== 'true' && saved !== 'false')) return invalid()

  return runAction(async () => {
    await saveThing(id, saved === 'true')
    return { saved: saved === 'true' }
  })
}

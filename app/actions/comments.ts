'use server'

import { refresh } from 'next/cache'
import { invalid, runAction } from '@/lib/actions/run-action'
import type { ActionResult } from '@/lib/actions/result'
import { waitForComment } from '@/lib/reddit/thread'
import {
  deleteComment as deleteRedditComment,
  editComment as editRedditComment,
  submitComment,
} from '@/lib/reddit/writes'

/*
 * Comment writes (design §8.2). Each re-renders the thread with `refresh()`,
 * so the server tree, not the client, shows the result.
 */

const PARENT = /^t[13]_[a-z0-9]+$/
const COMMENT = /^t1_[a-z0-9]+$/
/** Reddit's limit for comment bodies. */
const MAX_TEXT = 10_000

function readText(formData: FormData): string | null {
  const text = String(formData.get('text') ?? '').trim()
  return text.length > 0 && text.length <= MAX_TEXT ? text : null
}

export async function postComment(
  formData: FormData,
): Promise<ActionResult<{ id: string | null }>> {
  const parent = String(formData.get('parent') ?? '')
  const text = readText(formData)
  if (!PARENT.test(parent)) return invalid()
  if (!text) return invalid('Write something first (up to 10,000 characters).')

  return runAction(async () => {
    const { id, postId } = await submitComment(parent, text)
    if (id && postId) await waitForComment(postId, id)
    refresh()
    return { id }
  })
}

export async function editComment(formData: FormData): Promise<ActionResult> {
  const thing = String(formData.get('thing') ?? '')
  const text = readText(formData)
  if (!COMMENT.test(thing)) return invalid()
  if (!text) return invalid('Write something first (up to 10,000 characters).')

  return runAction(async () => {
    await editRedditComment(thing, text)
    refresh()
  })
}

export async function deleteComment(formData: FormData): Promise<ActionResult> {
  const thing = String(formData.get('thing') ?? '')
  if (!COMMENT.test(thing)) return invalid()

  return runAction(async () => {
    await deleteRedditComment(thing)
    refresh()
  })
}

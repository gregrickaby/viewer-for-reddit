'use server'

import { refresh } from 'next/cache'

import { COMMENT_MAX_CHARS } from '@/components/islands/composer-copy'
import type { ActionResult } from '@/lib/actions/result'
import { invalid, runAction } from '@/lib/actions/run-action'
import { isCommentFullname, isThingId, isVotableFullname } from '@/lib/reddit/names'
import { waitForComment } from '@/lib/reddit/thread'
import {
  deleteComment as deleteRedditComment,
  editComment as editRedditComment,
  submitComment,
} from '@/lib/reddit/writes'

/*
 * Comment writes. Each re-renders the thread with `refresh()`,
 * so the server tree, not the client, shows the result.
 */

function readText(formData: FormData): string | null {
  const text = String(formData.get('text') ?? '').trim()
  return text.length > 0 && text.length <= COMMENT_MAX_CHARS ? text : null
}

export async function postComment(
  formData: FormData,
): Promise<ActionResult<{ id: string | null }>> {
  const parent = String(formData.get('parent') ?? '')
  const text = readText(formData)
  if (!isVotableFullname(parent)) return invalid()
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
  if (!isCommentFullname(thing)) return invalid()
  if (!text) return invalid('Write something first (up to 10,000 characters).')

  return runAction(async () => {
    await editRedditComment(thing, text)
    refresh()
  })
}

export async function deleteComment(formData: FormData): Promise<ActionResult> {
  const thing = String(formData.get('thing') ?? '')
  const post = String(formData.get('post') ?? '')
  if (!isCommentFullname(thing)) return invalid()

  return runAction(async () => {
    await deleteRedditComment(thing)
    // The post id comes from the permalink and only drives the poll for the
    // deletion, so one that doesn't parse skips the poll, not the delete.
    if (isThingId(post)) await waitForComment(post, thing.slice(3), 'deleted')
    refresh()
  })
}

/** `deleteComment` with `useActionState`'s previous state first, so `ActionForm` shows errors. */
export async function deleteCommentForm(
  _: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult> {
  return deleteComment(formData)
}

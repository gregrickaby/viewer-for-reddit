'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { invalid, runAction } from '@/lib/actions/run-action'
import type { ActionResult } from '@/lib/actions/result'
import { RedditApiError, RedditNotFoundError } from '@/lib/reddit/errors'
import {
  type MultiVisibility,
  createMulti as createRedditMulti,
  deleteMulti as deleteRedditMulti,
  multiSlug,
  setMultiMembership,
  updateMulti as updateRedditMulti,
} from '@/lib/reddit/multis'
import { isMultiName, isSubredditName } from '@/lib/reddit/names'
import { getSubreddit } from '@/lib/reddit/reads'

/*
 * Multireddit actions (design §8.2, implementation §6). Each validates its
 * input, lets the data layer derive the multipath from the session, and
 * re-renders. The `…Form` variants take `useActionState`'s previous state
 * first, so `ActionForm` can show errors with or without JavaScript.
 */

type FormState = ActionResult<unknown> | null

const VISIBILITIES: readonly MultiVisibility[] = ['private', 'public', 'hidden']

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

/** Accepts `pics`, `r/pics`, or `/r/pics/`. */
function subredditName(value: string): string {
  return value.replace(/^\/?r\//i, '').replace(/\/$/, '')
}

function readDetails(formData: FormData) {
  const displayName = text(formData, 'displayName')
  const description = text(formData, 'description')
  if (displayName.length === 0 || displayName.length > 50) return null
  if (description.length > 500) return null
  return { displayName, description }
}

export async function createMultiForm(_: FormState, formData: FormData): Promise<FormState> {
  const details = readDetails(formData)
  if (!details) return invalid('Give it a name (up to 50 characters).')
  if (!multiSlug(details.displayName)) {
    return invalid('Use at least two letters or numbers in the name.')
  }

  const result = await runAction(() => createRedditMulti(details))
  if (!result.ok) return result
  redirect(`/multis/${result.data.name}`)
}

export async function updateMultiForm(_: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, 'name')
  const details = readDetails(formData)
  const visibility = VISIBILITIES.find((value) => value === formData.get('visibility'))
  if (!isMultiName(name) || !visibility) return invalid()
  if (!details) return invalid('Give it a name (up to 50 characters) and a shorter description.')

  return runAction(async () => {
    await updateRedditMulti(name, { ...details, visibility })
    refresh()
    return { saved: true }
  })
}

export async function deleteMulti(formData: FormData): Promise<ActionResult> {
  const name = text(formData, 'name')
  if (!isMultiName(name)) return invalid()
  const result = await runAction(() => deleteRedditMulti(name))
  if (!result.ok) return result
  redirect('/multis')
}

/**
 * Adds or removes one subreddit. Adding checks the subreddit exists first
 * (and uses its canonical capitalization), so nothing is written for a typo.
 */
export async function setMembership(
  formData: FormData,
): Promise<ActionResult<{ subreddit: string; member: boolean }>> {
  const name = text(formData, 'multi')
  const subreddit = subredditName(text(formData, 'subreddit'))
  const member = formData.get('member')
  if (!isMultiName(name) || (member !== 'true' && member !== 'false')) return invalid()
  if (!isSubredditName(subreddit)) return invalid('Enter a community name, like r/pics.')

  return runAction(async () => {
    const canonical = member === 'true' ? await canonicalName(subreddit) : subreddit
    await setMultiMembership(name, canonical, member === 'true')
    refresh()
    return { subreddit: canonical, member: member === 'true' }
  })
}

/** The subreddit's own capitalization, or an error naming it if it doesn't exist. */
async function canonicalName(subreddit: string): Promise<string> {
  try {
    return (await getSubreddit(subreddit)).name
  } catch (error) {
    if (!(error instanceof RedditNotFoundError)) throw error
    throw new RedditApiError(
      'Unknown subreddit',
      404,
      undefined,
      null,
      `r/${subreddit} doesn’t exist.`,
    )
  }
}

/** The "Add a subreddit" text form: `setMembership` with form state. */
export async function addToMultiForm(_: FormState, formData: FormData): Promise<FormState> {
  formData.set('member', 'true')
  return setMembership(formData)
}

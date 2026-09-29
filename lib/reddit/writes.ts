import 'server-only'
import { requireAuth } from '@/lib/auth/session'
import type { Vote } from '@/lib/view-models'
import { redditFetch } from './client'
import { parseResponse } from './listing'
import { EmptyResponse } from './schemas/responses'

/*
 * Writes (design §6.1). Like the reads, each derives the token from the
 * session. Callers validate ids first (lib/reddit/names.ts).
 */

export async function castVote(fullname: string, dir: Vote): Promise<void> {
  const { accessToken } = await requireAuth()
  const json = await redditFetch('/api/vote', {
    token: accessToken,
    method: 'POST',
    form: { id: fullname, dir },
  })
  parseResponse(json, EmptyResponse, '/api/vote')
}

export async function saveThing(fullname: string, saved: boolean): Promise<void> {
  const { accessToken } = await requireAuth()
  const path = saved ? '/api/save' : '/api/unsave'
  const json = await redditFetch(path, {
    token: accessToken,
    method: 'POST',
    form: { id: fullname },
  })
  parseResponse(json, EmptyResponse, path)
}

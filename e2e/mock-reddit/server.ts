/*
 * A small stand-in for oauth.reddit.com and www.reddit.com (implementation §8),
 * built from the committed samples in fixtures/reddit/things. Writes are kept
 * in memory so later reads reflect them. Test controls:
 *   POST /__mock/control  {"delayMs": 1500, "failNext": 1}  slow down or fail writes
 *   POST /__mock/reset                                      back to the samples
 *   GET  /__mock/state                                      votes, saves, subscriptions, …
 */
import { readFileSync, readdirSync } from 'node:fs'
import { type IncomingMessage, type ServerResponse, createServer } from 'node:http'
import path from 'node:path'

type Json = Record<string, unknown>

const THINGS = path.join(process.cwd(), 'fixtures/reddit/things')
const PORT = Number(process.env.MOCK_REDDIT_PORT ?? 4010)
const PAGE = 25

function samples(kind: string): Json[] {
  const dir = path.join(THINGS, kind)
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as Json)
}

const LINKS: Json[] = samples('Link').map((link, index) => ({
  ...link,
  // Unique, stable ids so paging and votes are predictable.
  id: `e2e${index.toString(36)}`,
  name: `t3_e2e${index.toString(36)}`,
  permalink: `/r/${String(link.subreddit)}/comments/e2e${index.toString(36)}/post_${index}/`,
  crosspost_parent_list: [],
}))
const COMMENTS = samples('Comment')
const SUBREDDITS = samples('Subreddit')
const MULTIS = samples('LabeledMulti')
const [ME] = samples('Me')
const [ACCOUNT] = samples('Account')
const VIEWER = String(ME!.name)

type State = {
  votes: Map<string, number>
  saved: Set<string>
  subscribed: Set<string>
  comments: Map<string, Json[]>
  deleted: Set<string>
  multis: Map<
    string,
    { display_name: string; description_md: string; visibility: string; subreddits: string[] }
  >
  delayMs: number
  failNext: number
  writes: Array<{ path: string; form: Json }>
}

function freshState(): State {
  return {
    votes: new Map(),
    saved: new Set(),
    subscribed: new Set(
      SUBREDDITS.filter((sr) => sr.user_is_subscriber).map((sr) =>
        String(sr.display_name).toLowerCase(),
      ),
    ),
    comments: new Map(),
    deleted: new Set(),
    multis: new Map(
      MULTIS.map((multi) => [
        String(multi.name),
        {
          display_name: String(multi.display_name),
          description_md: String(multi.description_md ?? ''),
          visibility: String(multi.visibility),
          subreddits: (multi.subreddits as Array<{ name: string }>).map((entry) => entry.name),
        },
      ]),
    ),
    delayMs: 0,
    failNext: 0,
    writes: [],
  }
}

let state = freshState()

// ── Shaping ───────────────────────────────────────────────────────────────────

const likes = (vote: number | undefined) => (vote === 1 ? true : vote === -1 ? false : null)

function withViewerState(link: Json): Json {
  const vote = state.votes.get(String(link.name))
  return {
    ...link,
    likes: vote === undefined ? link.likes : likes(vote),
    score: Number(link.score) + (vote ?? 0),
    saved:
      state.saved.has(String(link.name)) ||
      Boolean(link.saved && !state.saved.has(`-${String(link.name)}`)),
  }
}

function listing(kind: string, items: Json[], after: string | null = null): Json {
  return {
    kind: 'Listing',
    data: { after, before: null, children: items.map((data) => ({ kind, data })) },
  }
}

function page(items: Json[], query: URLSearchParams): Json {
  const after = query.get('after')
  const start = after ? items.findIndex((item) => item.name === after) + 1 : 0
  const slice = items.slice(start, start + PAGE)
  const next = start + PAGE < items.length ? String(slice.at(-1)?.name) : null
  return listing('t3', slice.map(withViewerState), next)
}

function subreddit(name: string): Json {
  const known = SUBREDDITS.find(
    (sr) => String(sr.display_name).toLowerCase() === name.toLowerCase(),
  )
  const base = known ?? {
    ...SUBREDDITS[0]!,
    id: name.toLowerCase(),
    name: `t5_${name.toLowerCase()}`,
    display_name: name,
  }
  return {
    ...base,
    display_name_prefixed: `r/${String(base.display_name)}`,
    user_is_subscriber: state.subscribed.has(String(base.display_name).toLowerCase()),
  }
}

function threadComments(link: Json): Json[] {
  const initial = COMMENTS.slice(0, 5).map((comment, index): Json => ({
    ...comment,
    id: `${String(link.id)}c${index}`,
    name: `t1_${String(link.id)}c${index}`,
    link_id: link.name,
    parent_id: link.name,
    depth: 0,
    replies: '',
    permalink: `${String(link.permalink)}${String(link.id)}c${index}/`,
  }))
  return [...initial, ...(state.comments.get(String(link.name)) ?? [])]
    .filter((comment) => !state.deleted.has(String(comment.name)))
    .map((comment) => {
      const vote = state.votes.get(String(comment.name))
      return { ...comment, likes: vote === undefined ? comment.likes : likes(vote) }
    })
}

function multiThing(name: string): Json | null {
  const multi = state.multis.get(name)
  if (!multi) return null
  const sample = MULTIS[0]!
  return {
    kind: 'LabeledMulti',
    data: {
      ...sample,
      ...multi,
      name,
      owner: VIEWER,
      path: `/user/${VIEWER}/m/${name}/`,
      can_edit: true,
      subreddits: multi.subreddits.map((sr) => ({ name: sr })),
    },
  }
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

function send(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  response.writeHead(status, { 'content-type': 'application/json', ...headers })
  response.end(body === undefined ? '' : JSON.stringify(body))
}

async function readForm(request: IncomingMessage): Promise<Json> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  const text = Buffer.concat(chunks).toString('utf8')
  if (request.headers['content-type']?.includes('json'))
    return text ? (JSON.parse(text) as Json) : {}
  return Object.fromEntries(new URLSearchParams(text))
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function handle(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
  const { pathname: p, searchParams: q } = url
  const method = request.method ?? 'GET'
  const form = method === 'GET' ? {} : await readForm(request)

  // Test controls
  if (p === '/__mock/control') {
    state.delayMs = Number(form.delayMs ?? 0)
    state.failNext = Number(form.failNext ?? 0)
    return send(response, 200, { ok: true })
  }
  if (p === '/__mock/reset') {
    state = freshState()
    return send(response, 200, { ok: true })
  }
  if (p === '/__mock/state') {
    return send(response, 200, {
      votes: Object.fromEntries(state.votes),
      saved: [...state.saved],
      subscribed: [...state.subscribed],
      writes: state.writes,
    })
  }

  // OAuth (www.reddit.com)
  if (p === '/api/v1/authorize') {
    const back = new URL(q.get('redirect_uri') ?? '/')
    back.searchParams.set('state', q.get('state') ?? '')
    back.searchParams.set('code', 'mock-code')
    response.writeHead(302, { location: back.href })
    return response.end()
  }
  if (p === '/api/v1/access_token') {
    return send(response, 200, {
      access_token: `mock-access-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'identity read history mysubreddits subscribe vote submit edit save',
      refresh_token: 'mock-refresh',
    })
  }
  if (p === '/api/v1/revoke_token') return send(response, 200, {})

  // Writes: optionally slow or failing.
  const isWrite = method !== 'GET'
  if (isWrite) {
    state.writes.push({ path: p, form })
    if (state.delayMs) await sleep(state.delayMs)
    if (state.failNext > 0) {
      state.failNext -= 1
      return send(response, 500, { message: 'Injected failure' })
    }
  }

  if (p === '/api/v1/me') return send(response, 200, ME)

  let match: RegExpExecArray | null
  if ((match = /^\/(best|hot|new|top|rising)$/.exec(p))) return send(response, 200, page(LINKS, q))
  if ((match = /^\/r\/([^/]+)\/(hot|new|top|rising)$/.exec(p))) {
    const name = match[1]!.toLowerCase()
    const own = LINKS.filter((link) => String(link.subreddit).toLowerCase() === name)
    return send(
      response,
      200,
      page(
        own.length > 0 || name === 'popular' || name === 'all' ? (own.length ? own : LINKS) : LINKS,
        q,
      ),
    )
  }
  if ((match = /^\/user\/[^/]+\/m\/[^/]+\/(hot|new|top|rising)$/.exec(p)))
    return send(response, 200, page(LINKS, q))
  if ((match = /^\/r\/([^/]+)\/about$/.exec(p)))
    return send(response, 200, { kind: 't5', data: subreddit(match[1]!) })
  if ((match = /^\/comments\/([a-z0-9]+)$/.exec(p))) {
    const link = LINKS.find((candidate) => candidate.id === match![1])
    if (!link) return send(response, 404, { message: 'Not Found' })
    return send(response, 200, [
      listing('t3', [withViewerState(link)]),
      listing('t1', threadComments(link)),
    ])
  }
  if (p === '/api/morechildren')
    return send(response, 200, { json: { errors: [], data: { things: [] } } })
  if (p === '/subreddits/mine/subscriber') {
    const mine = [...state.subscribed].map((name) => subreddit(name))
    return send(response, 200, listing('t5', mine))
  }
  if (p === '/subreddits/search')
    return send(
      response,
      200,
      listing(
        't5',
        SUBREDDITS.map((sr) => subreddit(String(sr.display_name))),
      ),
    )
  if (p === '/api/multi/mine') return send(response, 200, [...state.multis.keys()].map(multiThing))
  if ((match = /^\/api\/multi\/user\/[^/]+\/m\/([^/]+)(?:\/r\/([^/]+))?$/.exec(p))) {
    const [, name, sr] = match as unknown as [string, string, string | undefined]
    if (sr) {
      const multi = state.multis.get(name)
      if (!multi) return send(response, 404, { reason: 'MULTI_NOT_FOUND' })
      multi.subreddits =
        method === 'DELETE'
          ? multi.subreddits.filter((entry) => entry.toLowerCase() !== sr.toLowerCase())
          : [...new Set([...multi.subreddits, sr])]
      return send(response, 200, method === 'DELETE' ? {} : { name: sr })
    }
    if (method === 'GET') {
      const thing = multiThing(name)
      return thing ? send(response, 200, thing) : send(response, 404, { reason: 'MULTI_NOT_FOUND' })
    }
    if (method === 'DELETE') {
      state.multis.delete(name)
      return send(response, 200, {})
    }
    if (method === 'POST' && state.multis.has(name)) {
      return send(response, 409, {
        reason: 'MULTI_EXISTS',
        explanation: 'That multireddit already exists.',
      })
    }
    const model = JSON.parse(String(form.model)) as {
      display_name: string
      description_md: string
      visibility: string
      subreddits: Array<{ name: string }>
    }
    state.multis.set(name, { ...model, subreddits: model.subreddits.map((entry) => entry.name) })
    return send(response, 200, multiThing(name))
  }
  if ((match = /^\/user\/[^/]+\/saved$/.exec(p))) {
    const saved = LINKS.filter(
      (link) =>
        state.saved.has(String(link.name)) ||
        (link.saved && !state.saved.has(`-${String(link.name)}`)),
    )
    return send(response, 200, page(saved, q))
  }
  if ((match = /^\/user\/([^/]+)\/about$/.exec(p)))
    return send(response, 200, { kind: 't2', data: { ...ACCOUNT, name: match[1] } })
  if ((match = /^\/user\/[^/]+\/(overview|submitted|comments)$/.exec(p)))
    return send(response, 200, page(LINKS.slice(0, 10), q))

  // Writes
  if (p === '/api/vote') {
    state.votes.set(String(form.id), Number(form.dir))
    return send(response, 200, {})
  }
  if (p === '/api/save' || p === '/api/unsave') {
    const id = String(form.id)
    if (p === '/api/save') {
      state.saved.add(id)
      state.saved.delete(`-${id}`)
    } else {
      state.saved.delete(id)
      state.saved.add(`-${id}`)
    }
    return send(response, 200, {})
  }
  if (p === '/api/subscribe') {
    const name = String(form.sr_name).toLowerCase()
    if (form.action === 'sub') state.subscribed.add(name)
    else state.subscribed.delete(name)
    return send(response, 200, {})
  }
  if (p === '/api/comment') {
    const parent = String(form.thing_id)
    const link = parent.startsWith('t3_')
      ? parent
      : LINKS.find((candidate) => parent.startsWith(`t1_${String(candidate.id)}`))?.name
    const id = `new${Date.now().toString(36)}`
    const comment = {
      ...COMMENTS[0]!,
      id,
      name: `t1_${id}`,
      author: VIEWER,
      body: String(form.text),
      body_html: `<div class="md"><p>${String(form.text).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</p></div>`,
      link_id: link,
      parent_id: parent,
      depth: 0,
      replies: '',
      likes: true,
      score: 1,
    }
    state.comments.set(String(link), [...(state.comments.get(String(link)) ?? []), comment])
    return send(response, 200, {
      json: { errors: [], data: { things: [{ kind: 't1', data: comment }] } },
    })
  }
  if (p === '/api/editusertext') return send(response, 200, { json: { errors: [] } })
  if (p === '/api/del') {
    state.deleted.add(String(form.id))
    return send(response, 200, {})
  }

  return send(response, 404, { message: `Mock Reddit has no ${method} ${p}` })
}

createServer((request, response) => {
  handle(request, response).catch((error: unknown) => {
    console.error('[mock-reddit]', error)
    send(response, 500, { message: String(error) })
  })
}).listen(PORT, () => {
  console.log(`[mock-reddit] listening on http://localhost:${PORT} as u/${VIEWER}`)
})

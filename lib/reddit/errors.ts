import 'server-only'

/** Base class for every failure talking to Reddit (docs/design.md §6). */
export class RedditError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = new.target.name
  }
}

/** 401: the token was rejected even after the proxy's refresh. */
export class RedditAuthError extends RedditError {
  constructor() {
    super('Reddit rejected the session token', 401)
  }
}

export type ForbiddenReason = 'private' | 'quarantined' | 'banned' | 'gold_only' | 'unknown'

/** 403: private, quarantined, or banned subreddits; suspended users. */
export class RedditForbiddenError extends RedditError {
  constructor(readonly reason: ForbiddenReason) {
    super(`Reddit refused access (${reason})`, 403)
  }
}

/** 404, or a non-JSON response to a GET (Reddit sometimes serves an HTML page instead). */
export class RedditNotFoundError extends RedditError {
  constructor() {
    super('Not found on Reddit', 404)
  }
}

/** 429, or our own pre-emptive budget check. */
export class RedditRateLimitError extends RedditError {
  constructor(readonly resetSeconds: number) {
    super(`Reddit rate limit reached; retry in ${resetSeconds}s`, 429)
  }
}

/** Any other non-2xx, or a form-style `{ json: { errors } }` response. */
export class RedditApiError extends RedditError {
  constructor(
    message: string,
    status: number,
    readonly code?: string,
    readonly field?: string | null,
    /** Reddit's own human-readable reason, when it sends one (e.g. for multi names). */
    readonly explanation?: string,
  ) {
    super(message, status)
  }
}

/** An envelope (not an individual listing item) failed validation. */
export class RedditSchemaError extends RedditError {
  constructor(
    readonly endpoint: string,
    readonly issues: unknown,
  ) {
    super(`Unexpected response shape from ${endpoint}`, 502)
  }
}

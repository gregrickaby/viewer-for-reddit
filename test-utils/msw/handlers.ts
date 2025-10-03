import {
  authHandlers,
  commentHandlers,
  proxyHandlers,
  subredditHandlers,
  userHandlers,
  voteHandlers
} from './handlers/index'

export const handlers = [
  ...commentHandlers,
  ...authHandlers,
  ...subredditHandlers,
  ...userHandlers,
  ...proxyHandlers,
  ...voteHandlers
]

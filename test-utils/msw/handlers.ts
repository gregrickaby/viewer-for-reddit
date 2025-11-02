import {
  authHandlers,
  commentHandlers,
  logHandlers,
  proxyHandlers,
  subredditHandlers,
  subscribeHandlers,
  userHandlers,
  voteHandlers
} from './handlers/index'

export const handlers = [
  ...commentHandlers,
  ...authHandlers,
  ...logHandlers,
  ...subscribeHandlers,
  ...subredditHandlers,
  ...userHandlers,
  ...proxyHandlers,
  ...voteHandlers
]

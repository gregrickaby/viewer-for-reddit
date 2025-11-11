import {
  authHandlers,
  commentHandlers,
  logHandlers,
  proxyHandlers,
  saveHandlers,
  subredditHandlers,
  subscribeHandlers,
  userHandlers,
  voteHandlers
} from './handlers/index'

export const handlers = [
  ...commentHandlers,
  ...authHandlers,
  ...logHandlers,
  ...saveHandlers,
  ...subscribeHandlers,
  ...subredditHandlers,
  ...userHandlers,
  ...proxyHandlers,
  ...voteHandlers
]

import {
  authHandlers,
  commentHandlers,
  proxyHandlers,
  subredditHandlers,
  userHandlers
} from './handlers/index'

export const handlers = [
  ...commentHandlers,
  ...authHandlers,
  ...subredditHandlers,
  ...userHandlers,
  ...proxyHandlers
]

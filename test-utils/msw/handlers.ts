import {
  authHandlers,
  commentHandlers,
  logHandlers,
  multiredditHandlers,
  postsHandlers,
  proxyHandlers,
  saveHandlers,
  searchHandlers,
  subredditHandlers,
  subscribeHandlers,
  userHandlers,
  voteHandlers
} from './handlers/index'

export const handlers = [
  ...commentHandlers,
  ...authHandlers,
  ...logHandlers,
  ...multiredditHandlers,
  ...postsHandlers,
  ...saveHandlers,
  ...searchHandlers,
  ...subscribeHandlers,
  ...subredditHandlers,
  ...userHandlers,
  ...proxyHandlers,
  ...voteHandlers
]

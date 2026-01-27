import {authHandlers} from './handlers/authHandlers'
import {commentHandlers} from './handlers/commentHandlers'
import {logHandlers} from './handlers/logHandlers'
import {multiredditHandlers} from './handlers/multiredditHandlers'
import {postsHandlers} from './handlers/postsHandlers'
import {proxyHandlers} from './handlers/proxyHandlers'
import {saveHandlers} from './handlers/saveHandlers'
import {searchHandlers} from './handlers/searchHandlers'
import {subredditHandlers} from './handlers/subredditHandlers'
import {subscribeHandlers} from './handlers/subscribeHandlers'
import {userHandlers} from './handlers/userHandlers'
import {voteHandlers} from './handlers/voteHandlers'

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

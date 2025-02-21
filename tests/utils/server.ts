import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Create a new MSW server with the provided request handlers.
 */
export const server = setupServer(...handlers)

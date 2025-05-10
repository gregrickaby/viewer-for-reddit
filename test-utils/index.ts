import userEvent from '@testing-library/user-event'

// Testing libraries.
export * from '@testing-library/react'
export {http, HttpResponse} from 'msw'
export {userEvent}

// Pre-configured userEvent instance.
export const user = userEvent.setup()

// Custom render utilities.
export {render} from './render'
export {renderHook} from './renderHook'

// MSW server (for Vitest only).
export {server} from './msw/server'

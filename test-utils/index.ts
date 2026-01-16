// Testing libraries.
export * from '@testing-library/react'
export {default as userEvent} from '@testing-library/user-event'
export {HttpResponse, http} from 'msw'

// Pre-configured userEvent instance.
import userEvent from '@testing-library/user-event'
export const user = userEvent.setup()

// Custom render utilities.
export {render} from './render'
export {renderHook} from './renderHook'

// MSW server (for Vitest only).
export {server} from './msw/server'

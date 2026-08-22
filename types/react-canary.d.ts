/**
 * Activates the `react/canary` type declarations (e.g. `ViewTransition`).
 * Next.js's App Router bundles React's canary channel internally, so these
 * APIs work at runtime; `@types/react` just needs this import once,
 * anywhere in the project, to expose their types.
 */
import {} from 'react/canary'

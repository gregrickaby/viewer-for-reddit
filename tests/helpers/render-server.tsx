import type { ReactNode } from 'react'
import { prerender } from 'react-dom/static'

/**
 * Renders a server tree to HTML, waiting for async Server Components and every Suspense
 * boundary to settle, so tests see the final content instead of fallbacks.
 */
export async function renderServer(node: ReactNode): Promise<string> {
  const { prelude } = await prerender(<>{node}</>)
  return new Response(prelude).text()
}

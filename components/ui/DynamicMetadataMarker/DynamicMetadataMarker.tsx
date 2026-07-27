import {connection} from 'next/server'
import {Suspense} from 'react'

/**
 * Marks a route as genuinely dynamic when its `generateMetadata` reads
 * runtime data (e.g. an authenticated Reddit fetch) and so can't itself be
 * wrapped in `<Suspense>`. Render this once in the page body so the rest of
 * the route still prerenders as a static shell while the metadata resolves
 * at request time.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#with-cache-components
 */
export function DynamicMetadataMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  )
}

async function Connection() {
  await connection()
  return null
}

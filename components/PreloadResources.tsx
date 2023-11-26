'use client'

import ReactDom from 'react-dom'

/**
 * Preload resources.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints
 */
export default function PreloadResources() {
  ReactDom.preconnect('//preview.redd.it', {crossOrigin: 'anonymous'})
  return null
}

/**
 * Generic fetcher for useSWR() package.
 */
export async function fetcher(url: string) {
  return await fetch(url).then((res) => res.json())
}

/**
 * Grab the src of an iframe and replace it with something less terrible.
 */
export function cleanIframe({html}): string {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      ${source}
      allow="autoplay fullscreen"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      title="iframe"
    />`
}

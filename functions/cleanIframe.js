/**
 * Grab the src of an iframe, and replace it
 * with a less terrible version.
 *
 * @param {string}  html Raw HTML from reddit.
 * @return {string}      Clean <iframe> code.
 */
export default function cleanIframe({html}) {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      ${source}
      allow="autoplay"
      class="w-full aspect-video"
      loading="lazy"
      referrerpolicy="no-referrer"
      title="iframe"
    />`
}

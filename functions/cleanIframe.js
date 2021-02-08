/**
 * Grab the src of an iframe, and replace it
 * with a less terrible version.
 *
 * @param {string}  html Raw HTML from reddit.
 * @return {string}      Clean <iframe> code.
 */
export default function cleanIframe({height, html, width}) {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      ${source}
      allow="autoplay"
      class="card-iframe"
      height=${height}
      loading="lazy"
      referrerpolicy="no-referrer"
      title="iframe"
      width=${width}
    />`
}

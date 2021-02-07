/**
 * Grab the src of an iframe, and replace it
 * with a less terrible version.
 *
 * @param {string}  html Raw HTML from reddit.
 * @return {string}      Clean <iframe> code.
 */
export default function cleanIframe(html) {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      class="card-iframe"
      title="iframe"
      ${source}
      width="640"
      height="480"
      loading="lazy"
      allow="autoplay"
      referrerpolicy="no-referrer"
    />`
}

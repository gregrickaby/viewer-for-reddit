/**
 * Grab the src of an iframe, and replace it
 * with a less terrible version.
 *
 * @param {string}  html Raw HTML from reddit
 * @return {string}      Clean <iframe> code.
 */
export function cleanIframe(html) {
  const source = html.match(/(src="([^"]+)")/gi)

  return (
    <iframe
      src={source}
      width="512"
      height="442"
      loading="lazy"
      referrerpolicy="no-referrer"
    ></iframe>
  )
}

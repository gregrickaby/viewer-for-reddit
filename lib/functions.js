import * as config from '@/lib/constants'

/**
 * Grab the src of an iframe, and replace it
 * with a less terrible version.
 *
 * @param {string}  html Raw HTML from reddit.
 * @return {string}      Clean <iframe> code.
 */
export function cleanIframe(html) {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      class="card-iframe"
      title="iframe"
      ${source}
      width="512"
      height="512"
      loading="lazy"
      allow="autoplay"
      referrerpolicy="no-referrer"
    />`
}

/**
 * Decode html before using it with dangerouslySetInnerHTML.
 *
 * @link https://gomakethings.com/decoding-html-entities-with-vanilla-javascript/
 * @param {string}  html Raw HTML from reddit.
 * @return {string}      Decoded HTML.
 */
export function decodeHTML(html) {
  const txt = document.createElement('textarea') // eslint-disable-line no-undef
  txt.innerHTML = html
  return txt.value
}

/**
 * Generic scroll handler.
 */
export function scrollTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

/**
 * On scroll, add or remove a "shrink" class.
 *
 * @param {object} el The header element.
 */
export function shrinkHeader(el) {
  if (el) {
    const listener = () => {
      if (window.scrollY >= 100) {
        el.current.classList.add('shrink')
      } else {
        el.current.classList.remove('shrink')
      }
    }
    window.addEventListener('scroll', listener)
    return () => window.removeEventListener('scroll', listener)
  }
  return () => {}
}

/**
 * Fetch posts from Reddit.
 *
 * @param {string} term    The search term.
 * @param {integer} after  The last item viewed.
 */
export async function fetchData(term, after, sortOption) {
  const url =
    `https://www.reddit.com/r/${term}/${config.SORT_OPTIONS[sortOption]}/.json?limit=${config.COUNT_ITEMS_PER_FETCH}` +
    (after ? `&after=${after}` : '')

  // Fetch data from Reddit.
  const response = await fetch(url)

  // No response? Bail...
  if (!response.ok) {
    return {
      posts: [],
      after: null
    }
  }

  // Convert response to JSON.
  const body = await response.json()

  // No data? Bail...
  if (!body.data && !body.data.children) {
    return {
      posts: [],
      after: null
    }
  }

  // Filter out any "self" (aka text) posts.
  const postsContainImage = body.data.children.filter((post) => {
    return post.data.post_hint && post.data.post_hint !== 'self'
  })

  return {
    posts: postsContainImage,
    after: body.data.after
  }
}

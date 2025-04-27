/**
 * The home page route.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#pages
 */
export default async function Home() {
  return (
    <section>
      <h2>About</h2>
      <p>
        The Viewer for Reddit app is the best way to browse media on Reddit
        anonymously.
      </p>
      <p>
        With a focus on privacy, there&apos;s no tracking or logging of your
        activity—aside from the minimal server logs (maintained for operational
        integrity). Enjoy a clean, fast, and untracked browsing experience. To
        get started, try searching for a subreddit or click one of the popular
        subreddits above.
      </p>
    </section>
  )
}

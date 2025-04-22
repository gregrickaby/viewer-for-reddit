import {fetchPopularSubreddits} from '@/lib/actions'

/**
 * The home page route.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#pages
 */
export default async function Home() {
  const popular = await fetchPopularSubreddits()
  return (
    <section>
      <h2 className="">Trending</h2>
      {popular.data?.children.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {popular.data.children.map((subreddit) => (
            <a
              className="button"
              href={`/r/${subreddit.data.display_name}`}
              key={subreddit.data.id}
            >
              {subreddit.data.display_name}
            </a>
          ))}
        </div>
      ) : (
        <p>No popular subreddits found.</p>
      )}
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

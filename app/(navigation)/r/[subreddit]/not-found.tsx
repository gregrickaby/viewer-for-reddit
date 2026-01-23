/**
 * Subreddit not found page.
 * Shown when notFound() is called from a subreddit page.
 */
export default function SubredditNotFound() {
  return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <h1>Subreddit not found</h1>
      <p>This subreddit doesn't exist or has been banned.</p>
      <a href="/">Go Home</a>
    </div>
  )
}

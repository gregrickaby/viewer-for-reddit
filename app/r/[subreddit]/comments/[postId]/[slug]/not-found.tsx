/**
 * Post not found page.
 * Shown when notFound() is called from a post detail page.
 */
export default function PostNotFound() {
  return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <h1>Post not found</h1>
      <p>This post may have been deleted or removed.</p>
      <a href="/">Go Home</a>
    </div>
  )
}

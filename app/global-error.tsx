'use client'

/**
 * The last-resort error page: it replaces the root layout, so it brings its own
 * <html> and minimal styling, following the OS color scheme (design §12).
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en" style={{ colorScheme: 'light dark' }}>
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: 'Canvas',
          color: 'CanvasText',
        }}
      >
        <title>Something went wrong · Reddit Viewer</title>
        <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '4rem 1rem' }} role="alert">
          <h1>Something went wrong</h1>
          <p>Reddit Viewer hit an unexpected error. Trying again usually works.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ font: 'inherit', padding: '0.5rem 1rem' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}

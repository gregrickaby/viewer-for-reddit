/**
 * Healthcheck route.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    {status: 'ok'},
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
        'X-Robots-Tag': 'noindex'
      }
    }
  )
}

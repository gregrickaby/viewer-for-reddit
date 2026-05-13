import {NextResponse} from 'next/server'

/**
 * Health check endpoint for container orchestration.
 *
 * This endpoint does NOT make any external API calls (especially to Reddit)
 * to avoid rate limiting issues during health checks.
 *
 * @returns Simple status response indicating the app is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'viewer-for-reddit'
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    }
  )
}

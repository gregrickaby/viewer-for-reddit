import {getClientSession} from '@/lib/auth/session'
import {NextResponse} from 'next/server'

/**
 * Get current session information (client-safe, no tokens).
 */
export async function GET() {
  const session = await getClientSession()

  const response = NextResponse.json(session)

  // Prevent caching by CDN/proxies
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

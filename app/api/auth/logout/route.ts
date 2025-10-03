import {deleteSession} from '@/lib/auth/session'
import {NextResponse} from 'next/server'

export async function POST() {
  await deleteSession()

  const response = NextResponse.json({success: true})

  // Prevent caching by CDN/proxies
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

import {getClientSession} from '@/lib/auth/session'
import {NextResponse} from 'next/server'

/**
 * Get current session information (client-safe, no tokens).
 */
export async function GET() {
  const session = await getClientSession()
  return NextResponse.json(session)
}

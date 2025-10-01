import {auth} from '@/auth'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {NextRequest, NextResponse} from 'next/server'

type VoteDirection = -1 | 0 | 1

interface VoteRequestBody {
  dir?: VoteDirection
  id?: string
}

function isValidDirection(dir: unknown): dir is VoteDirection {
  return dir === -1 || dir === 0 || dir === 1
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({error: 'Forbidden'}, {status: 403})
  }

  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  let body: VoteRequestBody

  try {
    body = (await request.json()) as VoteRequestBody
  } catch (error) {
    logError(error, {
      component: 'redditVoteRoute',
      action: 'parseBody'
    })
    return NextResponse.json({error: 'Invalid request body'}, {status: 400})
  }

  const {dir, id} = body

  if (!id || !isValidDirection(dir)) {
    return NextResponse.json({error: 'Invalid vote payload'}, {status: 400})
  }

  try {
    const params = new URLSearchParams({
      dir: String(dir),
      id
    })

    const response = await fetch('https://oauth.reddit.com/api/vote', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent
      },
      body: params.toString()
    })

    if (!response.ok) {
      logError('Failed to vote on Reddit', {
        component: 'redditVoteRoute',
        action: 'vote',
        id,
        dir,
        status: response.status,
        statusText: response.statusText
      })
      return NextResponse.json(
        {error: 'Unable to vote'},
        {status: response.status}
      )
    }

    return NextResponse.json({success: true})
  } catch (error) {
    logError(error, {
      component: 'redditVoteRoute',
      action: 'vote',
      id,
      dir
    })
    return NextResponse.json({error: 'Internal server error'}, {status: 500})
  }
}

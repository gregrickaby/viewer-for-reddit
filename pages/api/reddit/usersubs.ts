import type {NextApiRequest, NextApiResponse} from 'next'
import {authOptions} from 'pages/api/auth/[...nextauth]'
import {unstable_getServerSession} from 'next-auth/next'

/**
 * Get user's subs.
 *
 * @see https://www.reddit.com/dev/api/oauth#GET_subreddits_mine_subscriber
 */
export default async function usersubs(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions)

  // No session? Bail...
  if (!session) {
    res.status(401).json({message: 'You must be logged in.'})
  }

  // No access token? Bail...
  if (!session.accessToken) {
    res.status(401).json({message: 'Missing access token.'})
  }

  try {
    const response = await fetch(
      'https://oauth.reddit.com/subreddits/mine/subscriber/',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer: ${session.accessToken}`
        }
      }
    )
    const subs = await response.json()
    res.status(200).json(subs)
  } catch (error) {
    res.status(500).json({message: `${error}`})
  }
}

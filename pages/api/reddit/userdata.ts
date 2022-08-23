import type {NextApiRequest, NextApiResponse} from 'next'
import {authOptions} from '../auth/[...nextauth]'
import {unstable_getServerSession} from 'next-auth/next'

/**
 * Get user's stuff from Reddit.
 *
 * @see https://www.reddit.com/dev/api/oauth
 */
export default async function userdata(
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
    // Try and fetch user's subs.
    const subResponse = await fetch(
      'https://oauth.reddit.com/subreddits/mine/subscriber',
      {
        headers: {
          authorization: `Bearer ${session.accessToken}`
        }
      }
    )
    const subJson = await subResponse.json()
    const subs = subJson.data.children.map((sub) => sub.data.display_name)

    // Try and fetch user's prefs.
    const prefsResponse = await fetch(
      'https://oauth.reddit.com/api/v1/me/prefs',
      {
        headers: {
          authorization: `Bearer ${session.accessToken}`
        }
      }
    )
    const prefs = await prefsResponse.json()

    // Try and fetch user's friends.
    const friendsResponse = await fetch(
      'https://oauth.reddit.com/prefs/friends',
      {
        headers: {
          authorization: `Bearer ${session.accessToken}`
        }
      }
    )
    const friends = await friendsResponse.json()

    // Try and fetch user's multis.
    const response = await fetch('https://oauth.reddit.com/api/multi/mine', {
      headers: {
        authorization: `Bearer ${session.accessToken}`
      }
    })
    const multis = await response.json()

    res.status(200).json({subs, prefs, friends, multis})
  } catch (error) {
    res.status(500).json({message: `${error}`})
  }
}

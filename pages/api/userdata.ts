import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

/**
 * Query user's stuff from Reddit.
 *
 * @see https://www.reddit.com/dev/api/oauth
 */
export default async function userdata(req: NextApiRequest, res: NextApiResponse) {
  // Get session data.
  const session = await unstable_getServerSession(req, res, authOptions);

  // No session? Bail...
  if (!session || !session?.accessToken) {
    res.status(401).json({ message: 'You must be logged in.' });
  }

  // Set headers.
  const headers = {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
    },
  };

  /**
   * Fetch user data.
   */
  return Promise.all([
    await fetch('https://oauth.reddit.com/subreddits/mine/subscriber', headers),
    await fetch('https://oauth.reddit.com/api/v1/me/prefs', headers),
    await fetch('https://oauth.reddit.com/prefs/friends', headers),
    await fetch('https://oauth.reddit.com/api/multi/mine', headers),
  ])
    .then(async ([subResponse, prefsResponse, friendsResponse, multisResponse]) => {
      if (!subResponse.ok || !prefsResponse.ok || !friendsResponse.ok || !multisResponse.ok) {
        throw new Error('There was an error fetching user data.');
      }

      const subJson = await subResponse.json();
      const subs = subJson.data.children.map((sub) => sub.data.display_name);
      const prefs = await prefsResponse.json();
      const friends = await friendsResponse.json();
      const multis = await multisResponse.json();

      res.status(200).json({ subs, prefs, friends, multis, session });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: `${error}` });
    });
}

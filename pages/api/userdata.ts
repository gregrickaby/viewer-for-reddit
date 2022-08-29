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
  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
  }

  // Set fetch headers.
  const fetchHeaders = {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
    },
  };

  /**
   * Fetch user data.
   */
  return Promise.all([
    fetch('https://oauth.reddit.com/subreddits/mine/subscriber', fetchHeaders),
    fetch('https://oauth.reddit.com/api/v1/me/prefs', fetchHeaders),
    fetch('https://oauth.reddit.com/prefs/friends', fetchHeaders),
    fetch('https://oauth.reddit.com/api/multi/mine', fetchHeaders),
  ])
    .then(async ([subResponse, prefsResponse, friendsResponse, multisResponse]) => {
      const subJson = await subResponse.json();
      const subs = subJson.data.children.map((sub) => sub.data.display_name);
      const prefs = await prefsResponse.json();
      const friends = await friendsResponse.json();
      const multis = await multisResponse.json();
      res.status(200).json({ subs, prefs, friends, multis, session });
    })
    .catch((error) => res.status(500).json({ message: `${error}` }));
}

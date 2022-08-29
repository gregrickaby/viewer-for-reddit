import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import config from '~/lib/config';
import { postResponseShaper } from '~/lib/helpers';
import { authOptions } from './auth/[...nextauth]';

/**
 * Query a subreddit.
 *
 * This query must be available to non-authenticated users.
 *
 * @see https://www.reddit.com/dev/api
 */
export default async function subreddit(req: NextApiRequest, res: NextApiResponse) {
  // No subreddit? Bail...
  if (!req.query.subreddit) {
    res.status(400).json({
      message: 'Missing subreddit query parameter.',
    });
  }

  // Get session data.
  const session = await unstable_getServerSession(req, res, authOptions);

  // Parse query and set defaults.
  const sort = req.query.sort ? req.query.sort : config.redditApi.sort;
  const limit = req.query.limit ? req.query.limit : config.redditApi.limit;
  const after = req.query.after ? req.query.after : '';

  /**
   * Fetch a subreddit.
   */
  if (session && session.accessToken) {
    try {
      const response = await fetch(
        `https://oauth.reddit.com/r/${req.query.subreddit}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`,
        {
          headers: {
            authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      const json = await response.json();
      res.status(200).json(postResponseShaper(json));
    } catch (error) {
      res.status(500).json({ message: `${error}` });
    }
  } else {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${req.query.subreddit}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`
      );
      const json = await response.json();
      res.status(200).json(postResponseShaper(json));
    } catch (error) {
      res.status(500).json({ message: `${error}` });
    }
  }
}

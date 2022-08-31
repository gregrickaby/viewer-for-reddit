import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import config from '~/lib/config';
import { postResponseShaper } from '~/lib/helpers';
import { authOptions } from './auth/[...nextauth]';

/**
 * Query a subreddit.
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

  // Parse query params and set defaults.
  const sort = req.query.sort ? req.query.sort : config.redditApi.sort;
  const limit = req.query.limit ? req.query.limit : config.redditApi.limit;
  const after = req.query.after ? req.query.after : '';
  const redditUrl = session ? 'oauth.reddit.com' : 'www.reddit.com';
  const headers = session?.accessToken
    ? {
        headers: {
          authorization: `Bearer ${session.accessToken}`,
        },
      }
    : {};

  /**
   * Fetch a subreddit.
   */
  try {
    const response = await fetch(
      `https://${redditUrl}/r/${req.query.subreddit}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`,
      headers
    );

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(postResponseShaper(data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `${error.message}` });
  }
}

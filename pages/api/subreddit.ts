import type { NextApiRequest, NextApiResponse } from 'next';
import { postResponseShaper } from '~/lib/helpers';

/**
 * Query a subreddit.
 *
 * This query must be available to non-authenticated users.
 *
 * @see https://www.reddit.com/dev/api
 */
export default async function subreddit(req: NextApiRequest, res: NextApiResponse) {
  // Parse query and set defaults.
  const after = req.query.after ? req.query.after : '';
  const sort = req.query.sort ? req.query.sort : 'hot';
  const sub = req.query.sub ? req.query.sub : 'itookapicture';
  const limit = req.query.limit ? req.query.limit : '24';

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${sub}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`
    );
    const json = await response.json();
    res.status(200).json(postResponseShaper(json));
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
}

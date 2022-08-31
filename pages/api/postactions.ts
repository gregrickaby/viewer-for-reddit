import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

/**
 * Handle various post interactions.
 *
 * @see https://www.reddit.com/dev/api
 */
export default async function postactions(req: NextApiRequest, res: NextApiResponse) {
  // No content ID or action query param? Bail...
  if (!req.query.id || !req.query.action) {
    res.status(400).json({
      message: 'Missing required query parameters.',
    });
    return;
  }

  // Get session data.
  const session = await unstable_getServerSession(req, res, authOptions);

  // No session? Bail...
  if (!session || !session?.accessToken) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }

  // Set up API headers.
  const headers = {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.accessToken}`,
    },
  };

  /**
   * Perform the post interaction.
   */
  switch (req.query.action) {
    case 'upvote':
    case 'downvote':
      try {
        const voteResponse = await fetch(
          `https://oauth.reddit.com/api/vote?id=${req.query.id}&dir=${
            req.query.action === 'upvote' ? 1 : -1
          }`,
          headers
        );

        if (!voteResponse.ok) {
          throw new Error(`${voteResponse.status} ${voteResponse.statusText}`);
        }

        res.status(200).json({ message: 'OK' });
      } catch (error) {
        res.status(500).json({ message: `${error}` });
      }
      break;

    case 'unvote':
      try {
        const unvoteResponse = await fetch(
          `https://oauth.reddit.com/api/vote?id=${req.query.id}&dir=0`,
          headers
        );

        if (!unvoteResponse.ok) {
          throw new Error(`${unvoteResponse.status} ${unvoteResponse.statusText}`);
        }

        res.status(200).json({ message: 'OK' });
      } catch (error) {
        res.status(500).json({ message: `${error}` });
      }
      break;

    default:
      try {
        const response = await fetch(
          `https://oauth.reddit.com/api/${req.query.action}?id=${req.query.id}`,
          headers
        );

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        res.status(200).json({ message: 'OK' });
      } catch (error) {
        res.status(500).json({ message: `${error}` });
      }
      break;
  }
}

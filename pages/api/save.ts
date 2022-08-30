import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

/**
 * Save a link.
 *
 * @see https://www.reddit.com/dev/api
 */
export default async function save(req: NextApiRequest, res: NextApiResponse) {
  // No multi? Bail...
  if (!req.query.id) {
    res.status(400).json({
      message: 'Missing content id query parameter.',
    });
  }

  // Get session data.
  const session = await unstable_getServerSession(req, res, authOptions);

  // No session? Bail...
  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
  }

  // If saving, save the link.
  if (req.query.save === 'true') {
    try {
      // Save the link.
      const response = await fetch(`https://oauth.reddit.com/api/save?id=${req.query.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.accessToken}`,
        },
      });

      // Success?
      if (response.ok) {
        res.status(200).json({ message: 'Saved.' });
      } else {
        res.status(response.status).json({ message: 'Failed to save.' });
      }
    } catch (error) {
      res.status(500).json({ message: `${error}` });
    }
  }

  // If unsaving, unsave the link.
  if (req.query.save === 'false') {
    try {
      // Unsave the link.
      const response = await fetch(`https://oauth.reddit.com/api/unsave?id=${req.query.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.accessToken}`,
        },
      });

      // Success?
      if (response.ok) {
        res.status(200).json({ message: 'Unsaved.' });
      } else {
        res.status(response.status).json({ message: 'Failed to unsave.' });
      }
    } catch (error) {
      res.status(500).json({ message: `${error}` });
    }
  }
}

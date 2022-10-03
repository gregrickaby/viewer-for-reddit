import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

/**
 * Search and autocomplete subreddit names.
 *
 * This query is only available to authenticated users.
 *
 * @see https://www.reddit.com/dev/api#GET_api_subreddit_autocomplete_v2
 */
export default async function search(req: NextApiRequest, res: NextApiResponse) {
  // Get the search term.
  const term = req.query.term ? req.query.term : '';

  // Get session data.
  const session = await unstable_getServerSession(req, res, authOptions);

  // No session? Return the term.
  if (!session || !session?.accessToken) {
    return res.status(200).json([
      {
        over18: null,
        url: `/r/${term}`,
        value: term,
      },
    ]);
  }

  try {
    const response = await fetch(
      `https://oauth.reddit.com/api/subreddit_autocomplete_v2?query=${term}&include_over_18=true&include_profiles=true&typeahead_active=true&search_query_id=6224f443-366f-48b7-9036-3a340e4df6df`,
      {
        headers: {
          authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const subs = await response.json();

    // Filter uneeded data to keep the payload small.
    const filtered = subs.data.children.map((sub) => {
      return {
        over18: sub.data.over18 ? true : false,
        url: sub.data.url ? sub.data.url : '',
        value: sub.data.display_name ? sub.data.display_name : '',
      };
    });

    res.status(200).json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `${error}` });
  }
}

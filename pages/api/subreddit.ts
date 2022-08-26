import type { NextApiRequest, NextApiResponse } from 'next';

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
    // Try and fetch a sub-reddit.
    const response = await fetch(
      `https://reddit.com/r/${sub}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`
    );
    const json = await response.json();

    // Filter out any self or stickied posts.
    const postsContainImage = json.data.children.filter(
      (post) => post.data.post_hint && post.data.post_hint !== 'self' && post.data.stickied !== true
    );

    res.status(200).json({
      posts: postsContainImage.map((post) => ({
        id: post.data.id,
        image: post.data.preview.images[0].resolutions.pop(),
        media: post.data.media,
        permalink: `https://www.reddit.com${post.data.permalink}`,
        secure_media: post.secure_media,
        subreddit: `https://www.reddit.com/${post.data.subreddit_name_prefixed}`,
        thumbnail: post.data.thumbnail,
        title: post.data.title,
        type: post.data.post_hint,
        ups: post.data.ups,
        url: post.data.url,
      })),
      after: json?.data?.after,
    });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
}

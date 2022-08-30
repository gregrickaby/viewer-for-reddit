import { signOut } from 'next-auth/react';

/**
 * Global fetcher function.
 */
export const fetcher = (resource, init) => fetch(resource, init).then((res) => res.json());

/**
 * Shape and trim the raw post response from subreddit.
 */
export function postResponseShaper(json: any): any {
  // Filter out any self or stickied posts.
  const postsContainImage = json.data.children.filter(
    (post) => post.data.post_hint && post.data.stickied !== true
  );

  return {
    posts: postsContainImage.map((post) => ({
      author: post.data.author,
      id: post.data.name,
      created: post.data.created_utc,
      comments: post.data.num_comments,
      image: post.data.preview.images[0].resolutions.pop(),
      media: post.data.media,
      permalink: `https://www.reddit.com${post.data.permalink}`,
      secure_media: post.secure_media,
      nsfw: post.data.over_18,
      spoiler: post.data.spoiler,
      subreddit: post.data.subreddit,
      thumbnail: post.data.thumbnail,
      title: post.data.title,
      type: post.data.post_hint,
      ups: post.data.ups,
      url: post.data.url,
    })),
    after: json?.data?.after,
  };
}

/**
 * Grab the src of an iframe and replace it with something less terrible.
 */
export function cleanIframe({ html }): string {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi);

  return `<iframe
      ${source}
      allow="autoplay fullscreen"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      style="aspect-ratio: 16/9; width: 100%;"
      title="iframe"
    />`;
}

/**
 * Clear local storage and sign out.
 */
export function logOut(): void {
  localStorage.removeItem('riv-app');
  localStorage.removeItem('riv-sort');
  localStorage.removeItem('riv-color-scheme');
  localStorage.removeItem('nextauth.message');
  signOut();
}

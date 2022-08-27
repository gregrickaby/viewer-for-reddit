import { signOut } from 'next-auth/react';
import useSWR from 'swr';

export interface SubredditProps {
  after?: string;
  lastPost?: string;
  limit?: number;
  shouldFetch?: boolean;
  sort?: string;
  subreddit?: string;
}

/**
 * Generic fetcher for useSWR() package.
 */
export async function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

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
      id: post.data.id,
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

export function logOut(): void {
  localStorage.removeItem('riv-app');
  localStorage.removeItem('nextauth.message');
  signOut();
}

/**
 * Fetch frontpage posts.
 */
export function useFrontpage() {
  const { data, error } = useSWR(`/api/frontpage`, fetcher);

  return {
    posts: data,
    isLoading: !error && !data,
    isError: error,
  };
}

/**
 * Fetch a subreddit and return the data.
 */
export function useSubreddit({
  limit,
  lastPost,
  sort,
  subreddit,
  shouldFetch,
}: SubredditProps): any {
  const { data, error } = useSWR(
    shouldFetch
      ? `/api/subreddit?sub=${subreddit || ''}&sort=${sort || ''}&limit=${limit || 24}&after=${
          lastPost || ''
        }`
      : null,
    fetcher
  );

  return {
    posts: data,
    isLoading: !error && !data,
    isError: error,
  };
}

/**
 * Fetch user's data from the API.
 */
export function useUserData(shouldFetch: boolean) {
  const { data, error } = useSWR(shouldFetch ? '/api/userdata' : null, fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return {
      userData: null,
    };
  }

  return {
    userData: data,
  };
}

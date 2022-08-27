import { Masonry } from 'masonic';
import { GetServerSideProps } from 'next';
import Layout from '~/components/Layout';
import { MasonryCard } from '~/components/MasonryCard';
import NotFound from '~/components/NotFound';
import { useRedditContext } from '~/components/RedditProvider';
import { useSubreddit } from '~/lib/helpers';

export interface SubredditProps {
  subreddit: string;
}

/**
 * Subreddit component.
 */
export default function Subreddit({ subreddit }) {
  const { sort } = useRedditContext();
  const { posts, isLoading } = useSubreddit({ subreddit, sort, shouldFetch: true });

  // Loading?
  if (isLoading) {
    return <Layout>Loading {subreddit}...</Layout>;
  }

  // No posts? Bail...
  if (!posts || posts.length === 0) {
    return (
      <Layout>
        <NotFound />
      </Layout>
    );
  }

  // Finally, render posts.
  return (
    <Layout>
      <Masonry
        items={posts.posts}
        render={MasonryCard}
        columnGutter={16}
        columnWidth={300}
        overscanBy={1}
      />
    </Layout>
  );
}

/**
 * Get the subreddit from the URL.
 */
export const getServerSideProps: GetServerSideProps = async (context) => ({
  props: {
    subreddit: context.query.id,
  },
});

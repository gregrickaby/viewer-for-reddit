import { LoadingOverlay, useMantineTheme } from '@mantine/core';
import { Masonry } from 'masonic';
import { GetServerSideProps } from 'next';
import useSWR from 'swr';
import Layout from '~/components/Layout';
import { MasonryCard } from '~/components/MasonryCard';
import NotFound from '~/components/NotFound';
import { useRedditContext } from '~/components/RedditProvider';
import { fetcher } from '~/lib/helpers';

export interface SubredditProps {
  subreddit: string;
}

/**
 * Subreddit component.
 */
export default function Subreddit({ subreddit }: SubredditProps) {
  const { sort } = useRedditContext();
  const theme = useMantineTheme();
  const {
    data: posts,
    isLoading,
    error,
  } = useSWR(`/api/subreddit?subreddit=${subreddit}&sort=${sort}`, fetcher);

  // If loading, show an empty Layout.
  if (isLoading) {
    return (
      <Layout>
        <LoadingOverlay overlayOpacity={0.3} visible={isLoading} />
      </Layout>
    );
  }

  // If something goes wrong, bail...
  if (!posts || !posts?.posts?.length || error) {
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
        items={posts?.posts}
        render={MasonryCard}
        columnGutter={theme.spacing.md}
        columnWidth={350}
        overscanBy={2}
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

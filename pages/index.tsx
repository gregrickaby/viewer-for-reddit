import { LoadingOverlay } from '@mantine/core';
import { Masonry } from 'masonic';
import useSWR from 'swr';
import Layout from '~/components/Layout';
import { MasonryCard } from '~/components/MasonryCard';
import NotFound from '~/components/NotFound';
import { useRedditContext } from '~/components/RedditProvider';
import { fetcher } from '~/lib/helpers';

/**
 * Frontpage component.
 */
export default function Frontpage() {
  const { sort } = useRedditContext();
  const { data: posts, isLoading, error } = useSWR(`/api/frontpage?sort=${sort}`, fetcher);

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
        columnGutter={64}
        columnWidth={300}
        overscanBy={2}
      />
    </Layout>
  );
}

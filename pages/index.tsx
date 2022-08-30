import { LoadingOverlay } from '@mantine/core';
import useSWR from 'swr';
import Card from '~/components/Card';
import Layout from '~/components/Layout';
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
      {posts?.posts.map((post) => (
        <Card key={post.id} data={post} />
      ))}
    </Layout>
  );
}

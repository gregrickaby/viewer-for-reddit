import { Masonry } from 'masonic';
import { useEffect } from 'react';
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
  const { sort, setLoading } = useRedditContext();
  const { data: posts, isLoading, error } = useSWR(`/api/frontpage?sort=${sort}`, fetcher);

  // Update global loading state.
  useEffect(() => {
    setLoading(false);
  }, [isLoading]);

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

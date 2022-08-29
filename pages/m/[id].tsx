import { Masonry } from 'masonic';
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import useSWR from 'swr';
import Layout from '~/components/Layout';
import { MasonryCard } from '~/components/MasonryCard';
import NotFound from '~/components/NotFound';
import { useRedditContext } from '~/components/RedditProvider';
import { fetcher } from '~/lib/helpers';

export interface MultiRedditProps {
  multiName: string;
}

/**
 * Multis component.
 */
export default function Multis({ multiName }: MultiRedditProps) {
  const { sort, setLoading } = useRedditContext();
  const {
    data: posts,
    isLoading,
    error,
  } = useSWR(`/api/multis?multi=${multiName}&sort=${sort}`, fetcher);

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

/**
 * Get the multi name from the URL.
 */
export const getServerSideProps: GetServerSideProps = async (context) => ({
  props: {
    multiName: context.query.id,
  },
});

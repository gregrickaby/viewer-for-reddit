import { Masonry } from 'masonic';
import Layout from '~/components/Layout';
import { MasonryCard } from '~/components/MasonryCard';
import NotFound from '~/components/NotFound';
import { useFrontpage } from '~/lib/helpers';

/**
 * Frontpage component.
 */
export default function Frontpage() {
  const { posts, isLoading } = useFrontpage();

  // Loading?
  if (isLoading) {
    return <Layout>Loading frontpage...</Layout>;
  }

  // No posts? Bail...
  if (!posts && posts.posts.length === 0) {
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
        columnGutter={64}
        columnWidth={300}
        overscanBy={2}
      />
    </Layout>
  );
}

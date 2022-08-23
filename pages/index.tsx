import Layout from '~/components/Layout';
import { useSubreddit } from '~/lib/helpers';

/**
 * Homepage component.
 *
 * This component displays the latest posts.
 */
export default function Homepage() {
  const { posts } = useSubreddit(true);

  return (
    <Layout>
      <pre>{JSON.stringify(posts, null, 2)}</pre>
    </Layout>
  );
}

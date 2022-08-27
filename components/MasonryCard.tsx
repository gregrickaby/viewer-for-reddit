import { Badge, Button, Card, Group, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import Media from '~/components/Media';

/**
 * Masonry Card component.
 *
 * @see https://github.com/jaredLunde/masonic#readme
 */
export function MasonryCard({ index, data, width }) {
  const router = useRouter();

  return (
    <Card key={index} p="lg" radius="md" shadow="sm" style={{ width }} withBorder>
      <Card.Section>
        <Media {...data} />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text weight={500}>{data.title}</Text>
        <Badge
          color="dark"
          variant="filled"
          onClick={() => router.push(`/r/${data.subreddit}`)}
          style={{ cursor: 'pointer' }}
        >
          r/{data.subreddit}
        </Badge>
        <Badge color="gray" variant="filled">
          {new Intl.NumberFormat().format(data.ups)}
        </Badge>
      </Group>

      <Button
        variant="light"
        color="blue"
        fullWidth
        mt="md"
        radius="md"
        component="a"
        href={data.permalink}
      >
        View Post
      </Button>
    </Card>
  );
}

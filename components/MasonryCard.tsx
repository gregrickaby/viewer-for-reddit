import { Badge, Card, Group, Text, useMantineTheme } from '@mantine/core';
import { useRouter } from 'next/router';
import { MdArrowUpward } from 'react-icons/md';
import Media from '~/components/Media';

/**
 * Masonry Card component.
 *
 * @see https://github.com/jaredLunde/masonic#readme
 */
export function MasonryCard({ index, data, width }) {
  const router = useRouter();
  const theme = useMantineTheme();

  return (
    <Card
      key={index}
      p={theme.spacing.sm}
      radius={theme.spacing.md}
      shadow="sm"
      style={{ width }}
      withBorder
    >
      <Card.Section>
        <Media {...data} />
      </Card.Section>

      <Group position="apart" mt={theme.spacing.md}>
        <Badge variant="outline">
          <MdArrowUpward />
          {new Intl.NumberFormat().format(data.ups)}
        </Badge>
        <Badge
          color={theme.colors.blue[3]}
          variant="outline"
          onClick={() => router.push(`/r/${data.subreddit}`)}
          style={{ cursor: 'pointer' }}
        >
          r/{data.subreddit}
        </Badge>
      </Group>

      <Text mt={theme.spacing.md} weight={700}>
        {data.title}
      </Text>
    </Card>
  );
}

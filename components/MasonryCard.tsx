import { Card, Group, Badge, Button, Text } from '@mantine/core';
import Media from './Media';

/**
 * Masonry Card component.
 */
export function MasonryCard({ index, data, width }) {
  return (
    <Card key={index} shadow="sm" p="lg" radius="md" withBorder style={{ width }}>
      <Card.Section>
        <Media {...data} />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text weight={500}>{data.title}</Text>
        <Badge color="green" variant="light">
          {data.ups}
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

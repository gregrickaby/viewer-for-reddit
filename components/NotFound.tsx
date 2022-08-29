import { Stack, Text } from '@mantine/core';
import Image from 'next/future/image';
import img from '../public/obi-404.webp';

/**
 * Not Found component.
 */
export default function NotFound() {
  return (
    <Stack>
      <Text>
        Either the Reddit API is down, this content doesn&apos;t exist, or something else is wrong.
        Please try again.
      </Text>
      <div style={{ width: '100%', height: 'auto' }}>
        <Image alt="404 not found" src={img} priority />
      </div>
    </Stack>
  );
}

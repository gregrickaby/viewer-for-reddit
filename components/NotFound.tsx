import { createStyles, Stack } from '@mantine/core';
import Image from 'next/future/image';
import img from '../public/not-found.webp';

const useStyles = createStyles(() => ({
  image: {
    img: {
      height: 'auto',
      width: '100%',
    },
  },
}));

/**
 * Not Found component.
 */
export default function NotFound() {
  const { classes } = useStyles();

  return (
    <Stack>
      <p>
        Either the Reddit API is down, this content doesn&apos;t exist, or something else is wrong.
        Please try again.
      </p>
      <div className={classes.image}>
        <Image alt="404 not found" src={img} priority />
      </div>
    </Stack>
  );
}

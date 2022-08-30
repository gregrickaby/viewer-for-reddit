import { createStyles, Text } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';
import Media from '~/components/Media';

const useStyles = createStyles((theme) => ({
  card: {
    border: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.gray[8] : theme.colors.gray[2]
    }`,
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: theme.fontSizes.sm,

    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.gray[2],
      textDecoration: 'none',
    },
  },
  score: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 1,
    marginBottom: '6px',
  },
  subreddit: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    fontSize: theme.fontSizes.xs,
    fontWeight: 700,

    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.gray[2],
      textDecoration: 'none',
    },
  },
  postedOn: {
    color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.gray[2],
    fontSize: theme.fontSizes.xs,
    fontWeight: 400,
  },
  title: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    margin: `${theme.spacing.md}px 0`,

    a: {
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      fontSize: theme.fontSizes.lg,
      fontWeight: 500,
      textDecoration: 'none',
      lineHeight: 1.5,
    },
  },
}));

/**
 * Masonry Card component.
 *
 * @see https://github.com/jaredLunde/masonic#readme
 */
export function MasonryCard({ index, data, width }) {
  const router = useRouter();
  const { classes } = useStyles();
  const date = new Date(data.created * 1000).toLocaleDateString('en-US');

  return (
    <div className={classes.card} key={index} style={{ width }}>
      <div className={classes.cardLeft}>
        <div>
          <MdArrowUpward />
        </div>
        <div className={classes.score}>{new Intl.NumberFormat().format(data.ups)}</div>
        <div>
          <MdArrowDownward />
        </div>
      </div>
      <div className={classes.cardRight}>
        <div className={classes.subreddit}>
          <Link href={`/r/${data.subreddit}`}>
            <a>r/{data.subreddit}</a>
          </Link>
        </div>
        <div>
          <Text className={classes.postedOn}>
            Posted by {data.author} on {date}
          </Text>
        </div>
        <div className={classes.title}>
          <Link href={data.permalink}>
            <a>{data.title}</a>
          </Link>
        </div>
        <div>
          <Media {...data} />
        </div>
        <div className={classes.cardFooter}>
          <div>
            <a href={data.permalink}>{new Intl.NumberFormat().format(data.comments)} comments</a>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Button, createStyles, Text } from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdBookmarkBorder,
  MdChatBubbleOutline,
} from 'react-icons/md';
import Media from '~/components/Media';
import { useRedditContext } from './RedditProvider';

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
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,

    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.gray[2],
    },
  },
  score: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: '6px',
  },
  subreddit: {
    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[8],
      fontSize: theme.fontSizes.xs,
      fontWeight: 700,
      textDecoration: 'none',
    },
  },
  postedOn: {
    color: theme.colors.gray[6],
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
    },
  },
  nsfw: {
    color: theme.colors.red[6],
    fontSize: theme.fontSizes.xs,
    fontWeight: 700,
    marginLeft: theme.spacing.sm,
  },
}));

/**
 * Save Button component.
 */
function SaveButton({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);

  // Save handler.
  async function handleSave(contentId: string) {
    await fetch(`/api/save?id=${contentId}&save=${!saved}`)
      .then((res) => {
        res.json();
        setSaved(!saved);
      })
      .catch(() => setSaved(false));
  }

  return (
    <Button
      component="a"
      onClick={() => handleSave(id)}
      leftIcon={<MdBookmarkBorder />}
      variant="subtle"
    >
      {saved ? 'Unsave' : 'Save'}
    </Button>
  );
}

/**
 * Card component.
 */
export default function Card({ data }) {
  const { app } = useRedditContext();
  const { classes } = useStyles();
  const date = new Date(data.created * 1000).toLocaleDateString('en-US');

  return (
    <div className={classes.card}>
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
          {app?.prefs?.label_nsfw && data.nsfw ? <span className={classes.nsfw}>NSFW</span> : null}
        </div>
        <div>
          <Media {...data} />
        </div>
        <div className={classes.cardFooter}>
          <Button
            component="a"
            href={data.permalink}
            leftIcon={<MdChatBubbleOutline />}
            variant="subtle"
          >
            {new Intl.NumberFormat().format(data.comments)} comments
          </Button>
          <SaveButton id={data.id} />
        </div>
      </div>
    </div>
  );
}

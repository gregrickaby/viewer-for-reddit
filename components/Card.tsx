import { Button, createStyles, Text, UnstyledButton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { BiDownvote, BiUpvote } from 'react-icons/bi';
import { MdBookmarkBorder, MdChatBubbleOutline } from 'react-icons/md';
import Media from '~/components/Media';
import { useRedditContext } from '~/components/RedditProvider';

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
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
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
  upvote: {
    color: '#ff4500',
    fill: '#ff4500',
  },
  downvote: {
    color: '#7193ff',
    fill: '#7193ff',
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

interface PostActionProps {
  id: string;
}

/**
 * Save Button component.
 */
function SaveButton({ id }: PostActionProps) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  async function save() {
    // No session? Bail...
    if (!session) {
      return;
    }

    await fetch(`/api/postactions?id=${id}&action=${saved ? 'unsave' : 'save'}`)
      .then((res) => {
        res.json();
        setSaved(!saved);
      })
      .catch(() => setSaved(false));
  }

  return (
    <Button component="a" onClick={() => save()} leftIcon={<MdBookmarkBorder />} variant="subtle">
      {saved ? 'Unsave' : 'Save'}
    </Button>
  );
}

/**
 * Vote Button component.
 */
function Score({ id, score }) {
  const { data: session } = useSession();
  const [voted, setVoted] = useState('');
  const { classes, cx } = useStyles();

  async function vote(voteType: 'upvote' | 'downvote') {
    // No session? Bail...
    if (!session) {
      return;
    }

    // If the user has already voted...
    if (voted) {
      // Undo the vote.
      await fetch(`/api/postactions?id=${id}&action=unvote`)
        .then(() => setVoted(''))
        .catch((error) => console.error(error));
    } else {
      // Otherwise, cast a vote.
      await fetch(`/api/postactions?id=${id}&action=${voteType}`)
        .then(() => setVoted(voteType))
        .catch((error) => console.error(error));
    }
  }

  return (
    <>
      <UnstyledButton onClick={() => vote('upvote')}>
        <BiUpvote className={voted === 'upvote' ? classes.upvote : ''} />
      </UnstyledButton>
      <div
        className={cx(
          classes.score,
          voted === 'upvote' ? classes.upvote : '',
          voted === 'downvote' ? classes.downvote : ''
        )}
      >{`${Math.floor(score / 100) / 10.0}k`}</div>
      <UnstyledButton onClick={() => vote('downvote')}>
        <BiDownvote className={voted === 'downvote' ? classes.downvote : ''} />
      </UnstyledButton>
    </>
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
        <Score id={data.id} score={data.score} />
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

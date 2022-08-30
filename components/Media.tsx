import { createStyles } from '@mantine/core';
import { useRedditContext } from './RedditProvider';

const useStyles = createStyles(() => ({
  image: {
    height: 'auto',
    objectFit: 'cover',
    width: '100%',
  },
  video: {
    width: '100%',
  },
}));

/**
 * Media component.
 */
export default function Media(props) {
  const { app } = useRedditContext();
  const { classes } = useStyles();

  switch (props.type) {
    case 'image':
      return (
        <a href={props.url} aria-label={props.title}>
          <img
            alt={props.title}
            className={classes.image}
            height={props.image.height}
            loading="lazy"
            src={props.image.url}
            width={props.image.width}
          />
        </a>
      );
    case 'hosted:video':
      return (
        <video
          autoPlay={app?.prefs?.video_autoplay}
          className={classes.video}
          controls
          muted
          playsInline
          poster={props.image.url}
          preload="metadata"
        >
          <source src={props.media.reddit_video.fallback_url} type="video/mp4" />
        </video>
      );
    case 'rich:video':
      return (
        <a href={props.url} aria-label={props.title}>
          <img
            alt={props.title}
            className={classes.image}
            height={props.media.oembed.thumbnail_height}
            loading="lazy"
            src={props.media.oembed.thumbnail_url}
            width={props.media.oembed.thumbnail_width}
          />
        </a>
      );
    case 'link':
      // Search for .gifv....
      if (props.url.includes('gifv')) {
        return (
          <video
            autoPlay={app?.prefs?.video_autoplay}
            className={classes.video}
            controls
            muted
            playsInline
            poster={props.image.url}
            preload="metadata"
          >
            <source src={props.url.replace('.gifv', '.mp4')} type="video/mp4" />
          </video>
        );
      }
      // No media? Return blank.
      return <></>;

    default:
      break;
  }
}

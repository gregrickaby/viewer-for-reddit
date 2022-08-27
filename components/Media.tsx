import { cleanIframe } from '~/lib/helpers';

/**
 * Media component.
 */
export default function Media(props) {
  switch (props.type) {
    case 'image':
      return (
        <a href={props.permalink} aria-label={props.title}>
          <img
            alt={props.title}
            height={props.image.height}
            loading="lazy"
            src={props.image.url}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: 'auto',
            }}
            width={props.image.width}
          />
        </a>
      );
    case 'hosted:video':
      return (
        <video
          autoPlay
          controls
          loop
          muted
          playsInline
          src={props.media.reddit_video.fallback_url}
          style={{
            width: '100%',
          }}
        />
      );
    case 'rich:video':
      return (
        <a
          aria-label={props.title}
          dangerouslySetInnerHTML={{
            __html: cleanIframe({
              html: props.media.oembed.html,
            }),
          }}
          href={props.url}
        />
      );
    case 'link':
      // Search for .gifv....
      if (props.url.includes('gifv')) {
        return (
          <video
            autoPlay
            controls
            loop
            muted
            playsInline
            src={props.url.replace('.gifv', '.mp4')} // Replace .gifv with .mp4.
            style={{ aspectRatio: '16/9', width: '100%' }}
          />
        );
      }
      // No media? Return blank.
      return <></>;

    default:
      break;
  }
}

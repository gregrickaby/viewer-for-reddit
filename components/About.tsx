import {fetchSubredditAbout} from '@/lib/actions'
import {decode} from 'html-entities'

/**
 * The about component.
 */
export default async function About({slug}: {slug: string}) {
  // Fetch the subreddit about data.
  const {data} = await fetchSubredditAbout(slug)

  return data ? (
    <header className="mx-auto mb-8 flex max-w-3xl flex-col items-center gap-4 text-left">
      <div className="flex gap-4">
        <img
          alt={data?.display_name}
          className="m-0 h-16 w-16 rounded-full bg-gray-200 object-cover p-0"
          loading="eager"
          src={data?.icon_img !== '' ? data?.icon_img : '/icon.png'}
        />
        <div className="flex flex-col items-start gap-1">
          <h2 className="m-0 p-0 capitalize leading-none">
            {decode(data?.title)}
          </h2>
          <div className="text-left leading-tight">
            <a
              title={`visit r/${data?.display_name}`}
              href={`https://www.reddit.com${data?.url}`}
              rel="noopener noreferrer"
            >
              r/{data?.display_name}
            </a>{' '}
            - {decode(data?.public_description)}
          </div>
        </div>
      </div>
    </header>
  ) : null
}

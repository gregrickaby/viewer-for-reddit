import {getTimeAgo, formatNumber} from '@/lib/functions'
import {RedditAboutResponse} from '@/lib/types'

/**
 * The about component.
 */
export default function About({data}: RedditAboutResponse) {
  return data ? (
    <header className="mx-auto mb-8 flex max-w-3xl flex-col items-center gap-4 text-left">
      <div className="flex gap-4">
        <img
          alt={data?.display_name}
          className="m-0 h-16 w-16 rounded-full bg-gray-200 object-cover p-0"
          loading="eager"
          src={data?.icon_img}
        />
        <div className="flex flex-col items-start gap-1">
          <h2
            className="m-0 p-0 capitalize leading-none"
            dangerouslySetInnerHTML={{__html: data?.title}}
          ></h2>
          <div className="text-left leading-tight text-zinc-500">
            r/{data?.display_name} - {data?.public_description}
          </div>
          <div className="flex gap-4 text-sm">
            <p>Created {getTimeAgo(data?.created_utc)}</p>
            <p>{formatNumber(data?.subscribers)} total users</p>
            <p className="flex items-center gap-1">
              <div className="h-2 w-2 rounded bg-green-500"></div>
              {formatNumber(data?.accounts_active)} users online
            </p>
          </div>
        </div>
      </div>
    </header>
  ) : null
}

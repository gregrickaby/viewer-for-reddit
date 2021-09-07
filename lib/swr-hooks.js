import useSWR from 'swr'

/**
 * Generic fetcher.
 *
 * @author Greg Rickaby
 * @param  {string}  url The url to fetch.
 * @return {Promise}     The fetched data.
 */
export function fetcher(url) {
  return fetch(url).then((res) => res.json())
}

/**
 * Query a subreddit.
 *
 * @author Greg Rickaby
 * @param  {string} query The subreddit name as query.
 * @return {object}       The fetched data.
 */
export function useSub(query) {
  const {data, error} = useSWR(`/api/sub?name=${query}`, fetcher)

  return {
    posts: data,
    isLoading: !error && !data,
    isError: error
  }
}

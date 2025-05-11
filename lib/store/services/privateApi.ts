'use client'

import {getRedditToken} from '@/lib/actions/redditToken'
import type {SearchChildData, SearchResponse} from '@/lib/types/search'
import {extractChildren} from '@/lib/utils/extractChildren'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

/**
 * The following queries need to be authenticated with a Reddit token.
 */
export const privateApi = createApi({
  reducerPath: 'privateApi',
  tagTypes: ['Search'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    prepareHeaders: async (headers) => {
      const token = await getRedditToken()
      if (token?.access_token) {
        headers.set('Authorization', `Bearer ${token.access_token}`)
      }
      return headers
    }
  }),
  endpoints: (builder) => ({
    /**
     * Search subreddits.
     *
     * @param query - The search query.
     * @param enableNsfw - Whether to include NSFW subreddits.
     *
     * @returns A list of SearchResults.
     */
    searchSubreddits: builder.query<
      SearchChildData[],
      {query: string; enableNsfw: boolean}
    >({
      query: ({query, enableNsfw}) =>
        `https://oauth.reddit.com/api/subreddit_autocomplete_v2?query=${query}&limit=10&include_over_18=${enableNsfw}&include_profiles=false&typeahead_active=true&search_query_id=${crypto.randomUUID()}`,
      transformResponse: (response: SearchResponse) =>
        extractChildren<SearchChildData>(response),
      providesTags: ['Search']
    })
  })
})

export const {useSearchSubredditsQuery} = privateApi

import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

export type VoteDirection = -1 | 0 | 1

export interface VotePayload {
  id: string
  dir: VoteDirection
}

export interface VoteResponse {
  success: boolean
}

const resolveBaseUrl = () =>
  typeof window === 'undefined' || process.env.NODE_ENV === 'test'
    ? 'http://localhost:3000/api/reddit'
    : '/api/reddit'

export const voteApi = createApi({
  reducerPath: 'voteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: resolveBaseUrl()
  }),
  endpoints: (builder) => ({
    vote: builder.mutation<VoteResponse, VotePayload>({
      query: (body) => ({
        url: '/vote',
        method: 'POST',
        body
      })
    })
  })
})

export const {useVoteMutation} = voteApi

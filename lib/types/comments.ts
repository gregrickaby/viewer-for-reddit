export interface CommentData {
  id?: string
  author?: string
  body?: string
  body_html?: string | null
  created_utc?: number
  ups?: number
  permalink?: string
}

export interface CommentChild {
  kind?: string
  data?: CommentData | null
}

export interface CommentsListing {
  kind?: string
  data?: {
    after?: string | null
    dist?: number
    children?: CommentChild[] | null
  }
}

export type CommentsResponse = Array<any> | CommentsListing

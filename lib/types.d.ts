/** Global types only. */

export interface ChildrenProps {
  children: React.ReactNode
}

export interface Posts {
  after: string
  posts: [
    {
      id: string
      images: []
      media: string
      permalink: string
      secure_media: string
      subreddit: string
      thumbnail: string
      title: string
      type: string
      ups: number
      url: string
    }
  ]
}

const config = {
  siteName: 'Viewer for Reddit',
  siteDescription: 'The best way to lurk on Reddit',
  metaDescription:
    'The best way to lurk on Reddit - browse images, videos, gifs, and posts without targeted ads or algorithms.',
  siteAuthor: 'Greg Rickaby',
  authorUrl: 'https://gregrickaby.com',
  githubUrl: 'https://github.com/gregrickaby/viewer-for-reddit',
  redditApi: {
    limit: 50,
    sort: 'hot',
    sub: 'itookapicture'
  },
  cacheTtl: 3600,
  get userAgent() {
    const agent = process.env.USER_AGENT
    if (!agent) {
      throw new Error('USER_AGENT environment variable is required')
    }
    return agent
  },
  get baseUrl() {
    const url = process.env.APP_URL
    if (!url) {
      throw new Error('APP_URL environment variable is required')
    }
    return url
  }
}

export default config

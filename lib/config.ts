const config = {
  siteName: 'Viewer for Reddit',
  siteDescription: 'Anonymously browse Reddit',
  metaDescription:
    'Anonymously browse images, videos, gifs, and other media from Reddit.',
  siteUrl: 'https://redditviewer.vercel.app/',
  siteAuthor: 'Greg Rickaby',
  authorUrl: 'https://gregrickaby.com',
  userAgent: 'web-app:viewer-for-reddit:* (by Greg Rickaby)',
  githubUrl: 'https://github.com/gregrickaby/viewer-for-reddit',
  redditApi: {
    popularLimit: '5',
    limit: '50',
    sort: 'hot',
    sub: 'itookapicture'
  },
  cacheTtl: 3600
}

export default config

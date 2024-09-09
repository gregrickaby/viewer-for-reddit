const config = {
  siteName: 'Viewer for Reddit',
  siteDescription: 'Anonymously browse Reddit',
  metaDescription:
    'Anonymously browse images, videos, gifs, and other media from Reddit.',
  siteUrl: 'https://reddit-viewer.com/',
  siteAuthor: 'Greg Rickaby',
  authorUrl: 'https://gregrickaby.com',
  userAgent: 'web-app:viewer-for-reddit:* (by Greg Rickaby)',
  githubUrl: 'https://github.com/gregrickaby/viewer-for-reddit',
  redditApi: {
    limit: 50,
    sort: 'hot',
    sub: 'itookapicture'
  },
  cacheTtl: 3600,
  newRelicAppId: process.env.NEW_RELIC_BROWSER_APP_ID!,
  newRelicLicenseKey: process.env.NEW_RELIC_BROWSER_LICENSE_KEY!
}

export default config

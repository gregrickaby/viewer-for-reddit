const config = {
  siteTitle: 'Viewer for Reddit',
  siteDescription: 'Anonymously browse Reddit',
  metaDescription:
    'Anonymously browse images, videos, gifs, and other media from Reddit.',
  siteUrl: 'https://reddit-image-viewer.vercel.app/',
  siteAuthor: '@gregrickaby',
  authorUrl: 'https://gregrickaby.com',
  userAgent: 'web-app:reddit-image-viewer:* (by @gregrickaby)',
  redditApi: {
    limit: '24',
    sort: 'hot',
    subReddit: 'itookapicture'
  }
}

export default config

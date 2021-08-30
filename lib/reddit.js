import snoowrap from 'snoowrap'

const reddit = new snoowrap({
  userAgent: 'reddit-image-viewer',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
})

export default reddit

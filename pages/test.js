const snoowrap = require('snoowrap')

export default function Test() {
  const r = new snoowrap({
    userAgent: 'reddit-image-viewer',
    clientId: process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID,
    clientSecret: process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET,
    refreshToken: process.env.NEXT_PUBLIC_REDDIT_REFRESH_TOKEN
  })

  const data = r.getSubreddit('pics').fetch().then(console.log)

  return (
    <>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  )
}

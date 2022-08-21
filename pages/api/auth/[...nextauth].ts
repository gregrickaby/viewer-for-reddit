import NextAuth from 'next-auth'
import RedditProvider from 'next-auth/providers/reddit'

export default NextAuth({
  providers: [
    RedditProvider({
      clientId: process.env.MANTINE_REDDIT_CLIENT_ID,
      clientSecret: process.env.MANTINE_REDDIT_CLIENT_SECRET
    })
  ]
})

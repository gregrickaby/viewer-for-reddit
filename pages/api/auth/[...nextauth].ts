import RedditProvider from 'next-auth/providers/reddit';
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

/**
 * Set authorization options for Reddit Provider.
 *
 * @see https://next-auth.js.org/providers/reddit
 * @see https://next-auth.js.org/configuration/providers/oauth
 * @see https://next-auth.js.org/configuration/callbacks
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#authorization
 *
 */
export const authOptions: NextAuthOptions = {
  providers: [
    RedditProvider({
      clientId: process.env.MANTINE_REDDIT_CLIENT_ID,
      clientSecret: process.env.MANTINE_REDDIT_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          image: profile.snoovatar_img,
        };
      },
      authorization: {
        params: {
          duration: 'permanent',
          scope: 'identity mysubreddits history save vote subscribe read flair',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Append Reddit access token to the JWT session.
        token.accessToken = account.access_token; // eslint-disable-line no-param-reassign
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Append the access token to the current session.
        session.accessToken = token.accessToken; // eslint-disable-line no-param-reassign
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

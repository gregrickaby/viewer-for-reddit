import NextAuth from 'next-auth'
import Reddit from 'next-auth/providers/reddit'
import config from '@/lib/config'
import type {JWT} from 'next-auth/jwt'

const scopes = ['identity', 'read', 'mysubreddits', 'vote']

interface RedditJWT extends JWT {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  scope?: string
  tokenError?: string
}

async function refreshAccessToken(token: RedditJWT): Promise<RedditJWT> {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret || !token.refreshToken) {
    return {...token, tokenError: 'Missing credentials for token refresh'}
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    )
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken
    })

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent
      },
      body: params.toString()
    })

    if (!response.ok) {
      return {
        ...token,
        tokenError: `Failed to refresh access token: ${response.status} ${response.statusText}`
      }
    }

    const refreshed = (await response.json()) as {
      access_token: string
      expires_in: number
      refresh_token?: string
      scope?: string
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      scope: refreshed.scope ?? token.scope,
      tokenError: undefined
    }
  } catch (error) {
    return {
      ...token,
      tokenError:
        error instanceof Error ? error.message : 'Token refresh failed'
    }
  }
}

export const {
  handlers: {GET, POST},
  auth,
  signIn,
  signOut
} = NextAuth({
  providers: [
    Reddit({
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      authorization: {
        params: {
          duration: 'permanent',
          scope: scopes.join(' ')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  trustHost: true,
  callbacks: {
    async jwt({token, account, user}) {
      const redditToken = token as RedditJWT

      if (account) {
        const expiresIn =
          typeof account.expires_in === 'number' ? account.expires_in : 3600
        return {
          ...redditToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? redditToken.refreshToken,
          expiresAt: Date.now() + expiresIn * 1000,
          scope: account.scope ?? redditToken.scope,
          name: user?.name ?? redditToken.name,
          picture: user?.image ?? redditToken.picture
        }
      }

      if (
        !redditToken.expiresAt ||
        Date.now() < redditToken.expiresAt - 60_000
      ) {
        return redditToken
      }

      return await refreshAccessToken(redditToken)
    },
    async session({session, token}) {
      const redditToken = token as RedditJWT

      if (redditToken.tokenError) {
        session.error = redditToken.tokenError
      }

      session.user = {
        ...session.user,
        name: (redditToken.name ?? session.user?.name) || null,
        image: (redditToken.picture ?? session.user?.image) || null
      }

      return {
        ...session,
        accessToken: redditToken.accessToken,
        refreshToken: redditToken.refreshToken,
        scope: redditToken.scope,
        expiresAt: redditToken.expiresAt
      }
    }
  }
})

import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    // If the app is deployed on Vercel, redirect the old URLs to the new domain.
    if (process.env.VERCEL_ENV === 'production') {
      return [
        {
          source: 'https://viewer-for-reddit.vercel.app',
          destination: 'https://reddit-viewer.com/',
          permanent: true
        },
        {
          source: 'https://reddit-image-viewer.vercel.app',
          destination: 'https://reddit-viewer.com/',
          permanent: true
        },
        {
          source: 'https://redditviewer.vercel.app',
          destination: 'https://reddit-viewer.com/',
          permanent: true
        },
        {
          source: '/r/:path*',
          destination: 'https://reddit-viewer.com/r/:path*',
          permanent: true
        }
      ]
    } else {
      return [
        {
          source: '/r',
          destination: '/',
          permanent: true
        }
      ]
    }
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

export default nextConfig

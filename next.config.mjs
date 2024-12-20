/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // If the app is deployed on Vercel, redirect to the custom domain.
    if (process.env.VERCEL_ENV === 'production') {
      return [
        {
          source: '/',
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

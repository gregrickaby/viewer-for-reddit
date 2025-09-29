import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.redditmedia.**',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '**.redd.**',
        pathname: '/**'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' data:",
              "script-src 'self' 'unsafe-inline' https: data:",
              "img-src 'self' 'unsafe-inline' data: https: http:",
              "connect-src 'self' https:",
              "frame-src 'self' https:",
              "media-src 'self' data: https: http: blob:",
              "style-src 'self' 'unsafe-inline' https: data:",
              "font-src 'self' 'unsafe-inline' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ]
  },
  experimental: {
    globalNotFound: true,
    useCache: true,
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications'
    ]
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

export default nextConfig

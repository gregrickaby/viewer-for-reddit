import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
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
    const isDevelopment = process.env.NODE_ENV === 'development'
    const scriptSrc = isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:"
      : "script-src 'self' 'unsafe-inline' https: data:"

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' data:",
              scriptSrc,
              "img-src 'self' 'unsafe-inline' data: https: http:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "media-src 'self' data: https: http: blob:",
              "style-src 'self' 'unsafe-inline' https: data:",
              "font-src 'self' 'unsafe-inline' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests'
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

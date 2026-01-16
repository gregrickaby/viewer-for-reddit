import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    inlineCss: true,
    globalNotFound: true,
    optimizePackageImports: [
      '@mantine/carousel',
      '@mantine/core',
      '@mantine/hooks',
      '@tabler/icons-react'
    ],
    serverComponentsExternalPackages: ['jsdom']
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.redd.it'
      },
      {
        protocol: 'https',
        hostname: '**.redditstatic.com'
      },
      {
        protocol: 'https',
        hostname: '**.redditmedia.com'
      },
      {
        protocol: 'https',
        hostname: 'external-preview.redd.it'
      }
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami.wiregrasswebsites.com https://static.cloudflareinsights.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https://*.redd.it https://*.redditstatic.com https://*.redditmedia.com https://external-preview.redd.it; " +
              "media-src 'self' https://*.redd.it https://v.redd.it https://*.reddit.com; " +
              "connect-src 'self' https://oauth.reddit.com https://www.reddit.com https://umami.wiregrasswebsites.com https://static.cloudflareinsights.com; " +
              "font-src 'self' data:; " +
              "frame-src 'none'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';"
          }
        ]
      }
    ]
  }
}

export default nextConfig

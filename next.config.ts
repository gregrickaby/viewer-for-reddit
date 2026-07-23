import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Exposed to the browser bundle without the NEXT_PUBLIC_ prefix (project convention).
  env: {
    DD_APPLICATION_ID: process.env.DD_APPLICATION_ID,
    DD_CLIENT_TOKEN: process.env.DD_CLIENT_TOKEN,
    DD_SITE: process.env.DD_SITE,
    DD_SERVICE: process.env.DD_SERVICE
  },
  // dd-trace patches Node internals via require hooks; it must run
  // unbundled and be initialized before Next.js loads (NODE_OPTIONS
  // in the dev/start scripts), not through instrumentation.ts.
  serverExternalPackages: ['dd-trace'],
  experimental: {
    inlineCss: true,
    prefetchInlining: true,
    appNewScrollHandler: true,
    optimizePackageImports: [
      '@mantine/carousel',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@mantine/spotlight',
      '@tabler/icons-react',
      'react-markdown'
    ],
    sri: {
      algorithm: 'sha256'
    }
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
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https://*.redd.it https://*.redditstatic.com https://*.redditmedia.com https://external-preview.redd.it https://media.giphy.com https://i.giphy.com; " +
              "media-src 'self' blob: https://*.redd.it https://v.redd.it https://*.reddit.com; " +
              "connect-src 'self' https://oauth.reddit.com https://v.redd.it https://*.redd.it https://static.cloudflareinsights.com https://browser-intake-us5-datadoghq.com; " +
              "worker-src 'self' blob:; " +
              "font-src 'self' data:; " +
              "manifest-src 'self'; " +
              'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://player.twitch.tv https://streamable.com; ' +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';"
          }
        ]
      },
      {
        // Cache public folder assets (images, fonts, etc.)
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

export default nextConfig

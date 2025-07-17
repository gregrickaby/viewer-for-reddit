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
  experimental: {
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

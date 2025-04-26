import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks']
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

export default nextConfig

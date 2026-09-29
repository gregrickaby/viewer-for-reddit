import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Comments cap at 10k characters; nothing else we submit is large.
      bodySizeLimit: '100kb',
    },
  },
}

export default nextConfig

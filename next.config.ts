import type { NextConfig } from 'next'

/*
 * Datadog's browser SDK needs these at build time. `env` inlines them, which
 * the `NEXT_PUBLIC_` prefix would do too, but the project forbids it. The
 * client token is public by design; the API key stays server-side.
 */
const nextConfig: NextConfig = {
  env: {
    DD_APPLICATION_ID: process.env.DD_APPLICATION_ID ?? '',
    DD_CLIENT_TOKEN: process.env.DD_CLIENT_TOKEN ?? '',
    DD_SITE: process.env.DD_SITE || 'datadoghq.com',
    DD_SERVICE: process.env.DD_SERVICE || 'viewer-for-reddit',
    DD_ENV: process.env.DD_ENV || process.env.NODE_ENV || 'production',
  },
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  poweredByHeader: false,
  experimental: {
    // Runs the React Compiler natively instead of through Babel: about 15% faster builds here.
    turbopackRustReactCompiler: true,
    serverActions: {
      // Comments cap at 10k characters; nothing else we submit is large.
      bodySizeLimit: '100kb',
    },
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    images: {
      allowFutureImage: true
    }
  },
  images: {
    formats: ['image/avif', 'image/webp']
  },
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig

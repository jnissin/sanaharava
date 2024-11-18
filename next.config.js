/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': [
        'data/**/*'
      ]
    }
  }
}

module.exports = nextConfig
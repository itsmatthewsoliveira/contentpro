/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', '@resvg/resvg-js', 'sharp'],
  },
}

module.exports = nextConfig

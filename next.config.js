/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // We removed the eslint section to satisfy the new version of Next.js
}

module.exports = nextConfig
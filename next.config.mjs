/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopack: {
      // Silence internal workspace warnings from having multiple 
      // package-lock.json or package.json files in parent folders
      root: '../',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/stress/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
      {
        source: '/api/v1/posture/:path*',
        destination: 'http://127.0.0.1:8001/:path*',
      },
    ]
  },
}

export default nextConfig

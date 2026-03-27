/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sharp', 'onnxruntime-node', '@xenova/transformers'],
  async rewrites() {
    return [
      {
        source: '/api/v1/stress/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/:path*`,
      },
      {
        source: '/api/v1/posture/:path*',
        destination: `${process.env.NEXT_PUBLIC_POSTURE_URL || 'http://127.0.0.1:8001'}/:path*`,
      },
    ]
  },
}

export default nextConfig

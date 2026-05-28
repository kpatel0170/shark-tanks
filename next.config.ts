import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 15+ blocks cross-origin dev requests by default.
  // Replit proxies the preview through a different subdomain, so we must allow it.
  allowedDevOrigins: ['*.replit.dev', '*.worf.replit.dev', '*.repl.co'],
  serverExternalPackages: ['ws', '@react-three/fiber'],
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      three: require.resolve('three'),
    }
    return config
  },
}

export default nextConfig

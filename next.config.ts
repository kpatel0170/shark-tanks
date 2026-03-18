import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

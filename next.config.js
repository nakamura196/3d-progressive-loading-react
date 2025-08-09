/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // React Three Fiberとの互換性のため一時的に無効化
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config, { isServer }) => {
    // GLBファイルの処理
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });
    
    // React Three Fiberのalias設定
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-three/fiber': '@react-three/fiber/dist/react-three-fiber.esm.js',
      };
    }
    
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/data/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/:path*.glb',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @opentelemetry/context-async-hooks uses Node.js's 'async_hooks' module, which is not available in the browser.
      // This webpack configuration ensures that the module is not bundled for the client-side, resolving the build error.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/context-async-hooks': false,
      };
    }
    return config;
  },
};

export default nextConfig;

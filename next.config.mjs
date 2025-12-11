
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Adicionado para lidar com módulos WebAssembly
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Garante que módulos 'fs', 'net', e 'http2' não sejam empacotados no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        http2: false,
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);

// Teste de sincronização automática para o clean-core.

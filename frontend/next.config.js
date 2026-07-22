const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { domains: ['localhost', '185.98.139.38'] },
  // Le lint est exécuté manuellement via `npm run lint`, jamais pendant le build.
  // Cela garantit que `next build` reste vert même si ESLint remonte des erreurs.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = withNextIntl(nextConfig);

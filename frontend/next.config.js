const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // A3 : ne pas divulguer "X-Powered-By: Next.js"
  images: { domains: ['localhost', '185.98.139.38'] },
  // Le lint est exécuté manuellement via `npm run lint`, jamais pendant le build.
  // Cela garantit que `next build` reste vert même si ESLint remonte des erreurs.
  eslint: { ignoreDuringBuilds: true },
  // En-têtes de sécurité durcis (section 46.3 #8), appliqués à toutes les pages.
  //
  // Choix CSP : REPORT-ONLY. Next.js 14 injecte des scripts/styles inline (hydration,
  // styled-jsx), le landing charge Google Fonts, des logos ibigsoft.com, le script
  // same-origin ibigsoft-universal.js, et appelle l'API SANTAREX. L'IA (SARA) passe
  // désormais par le backend — plus aucun appel Groq direct depuis le navigateur.
  // Une CSP appliquée risquerait de casser le rendu ; on rapporte sans bloquer.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: http://185.98.139.38",
      "connect-src 'self' https://santarex.ibigsoft.com",
      "frame-ancestors 'self'",
    ].join('; ');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

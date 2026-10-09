import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/reports/*/download': [
      './src/features/reports/fonts/*',
      './node_modules/pdfkit/js/data/*',
    ],
  },
};
export default config;

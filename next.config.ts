import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/legal-library/pdf': ['./src/features/legal-library/documents/*.pdf'],
    '/api/administration/organizations/*/export': [
      './src/features/reports/fonts/*',
      './node_modules/pdfkit/js/data/*',
    ],
    '/api/reports/*/download': [
      './src/features/reports/fonts/*',
      './node_modules/pdfkit/js/data/*',
    ],
  },
};
export default config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide X-Powered-By
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Clickjacking defense
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // MIME-sniffing prevention
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()', // Restrict sensor access strictly to microphone on self
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Reflected XSS filter
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

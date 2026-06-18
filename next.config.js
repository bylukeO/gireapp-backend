/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict React mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/gireapp-media/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── Security Headers (BE-SEC-006) ──
  // Target: securityheaders.com A grade
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // DNS prefetch for performance
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // HSTS: 2 years, include subdomains, allow preload list
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent clickjacking — DENY all frames
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME-type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restrict browser features
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // Legacy XSS protection (still useful for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Content Security Policy — comprehensive
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only self
              "default-src 'self'",
              // Scripts: self + inline for Next.js hydration + eval for dev
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Styles: self + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: self + S3 + CloudFront + data URIs + blobs
              "img-src 'self' data: blob: https://*.amazonaws.com https://*.cloudfront.net",
              // API connections: self + S3 + Sentry + Resend
              "connect-src 'self' https://*.amazonaws.com https://*.sentry.io https://api.resend.com",
              // Frames: Calendly for mentorship scheduling
              "frame-src 'self' https://calendly.com",
              // Media: CloudFront for video content
              "media-src 'self' https://*.cloudfront.net https://*.amazonaws.com",
              // Object embeds: none (security)
              "object-src 'none'",
              // Base URI: restrict to self
              "base-uri 'self'",
              // Form targets: restrict to self
              "form-action 'self'",
              // Frame ancestors: prevent embedding
              "frame-ancestors 'none'",
              // CSP violation reports
              "report-uri /api/csp-report",
            ].join('; '),
          },
          // Also set Report-To header for newer browsers
          {
            key: 'Report-To',
            value: JSON.stringify({
              group: 'csp-violations',
              max_age: 10886400,
              endpoints: [{ url: '/api/csp-report' }],
            }),
          },
          // Prevent cross-origin information leaks
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

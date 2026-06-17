// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        // Apply to all routes — explicitly return empty array to avoid
        // Next.js injecting X-Frame-Options: SAMEORIGIN by default.
        // Do NOT add X-Frame-Options or frame-ancestors CSP here.
        source: '/(.*)',
        headers: [
          // Intentionally no X-Frame-Options header.
          // Intentionally no Content-Security-Policy with frame-ancestors.
          // App must render inside a cross-origin iframe (F9 / US-9.1).
        ],
      },
    ];
  },
};

export default nextConfig;

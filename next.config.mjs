// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // No custom headers() function — Next.js 14 does not add X-Frame-Options
  // by default, so omitting this function means no X-Frame-Options header
  // is sent, allowing cross-origin iframe embedding (F9 / C-2).
  // NOTE: an empty headers array (headers: []) causes Next.js 14 to throw
  // "Invalid header found" on startup — must be omitted entirely.
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Auth service → :4001
      {
        source: "/auth/:path*",
        destination: "http://localhost:4001/auth/:path*",
      },
      // REST service → :4002
      {
        source: "/rest/:path*",
        destination: "http://localhost:4002/rest/:path*",
      },
      // Storage service → :4003
      {
        source: "/storage/:path*",
        destination: "http://localhost:4003/storage/:path*",
      },
    ];
  },
};

export default nextConfig;

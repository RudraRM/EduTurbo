/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // pdfjs-dist optionally requires the "canvas" package for Node — not needed in the browser.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

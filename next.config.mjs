/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Enable static file serving from /public directory
    reactStrictMode: true,
    // Ensure HTML files are served correctly
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'html']
};

export default nextConfig; 
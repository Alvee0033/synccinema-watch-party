/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true,
    experimental: {
        instrumentationHook: true,
        missingSuspenseWithCSRBailout: true,
    },
    images: {
        unoptimized: true,
    },
};

export default nextConfig;

import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Legacy redirects for old marketing URLs that no longer exist as
   * pages. `/pricing` is intentionally NOT redirected — it's a real
   * deep page now. Same will apply to `/explore` once that page ships.
   * The remaining sources land on the closest narrative anchor on `/`.
   */
  async redirects() {
    return [
      { source: '/about', destination: '/#thesis', permanent: true },
      { source: '/features', destination: '/product', permanent: true },
      { source: '/explore', destination: '/#explore', permanent: true },
      { source: '/contact', destination: '/#footer', permanent: true },
      { source: '/identity', destination: '/', permanent: true },
    ]
  },
  /**
   * Serve the mobile deep-link association files as JSON. The Apple file has
   * no extension, so Next would otherwise serve it as octet-stream; iOS and
   * Android both expect `application/json` over HTTPS with no redirects.
   */
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
}

export default nextConfig

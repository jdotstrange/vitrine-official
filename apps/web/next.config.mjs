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
}

export default nextConfig

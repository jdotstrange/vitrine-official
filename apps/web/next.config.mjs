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
   * 301s for the legacy multi-page marketing routes (about / pricing /
   * features / explore / contact / identity). The V3 site is single-page
   * with anchored sections, so we permanently redirect each old URL to its
   * closest narrative anchor on `/`. Identity has no clean anchor analog,
   * so it lands on the home root.
   */
  async redirects() {
    return [
      { source: '/about', destination: '/#thesis', permanent: true },
      { source: '/pricing', destination: '/#pro', permanent: true },
      { source: '/features', destination: '/#intelligence', permanent: true },
      { source: '/explore', destination: '/#explore', permanent: true },
      { source: '/contact', destination: '/#footer', permanent: true },
      { source: '/identity', destination: '/', permanent: true },
    ]
  },
}

export default nextConfig

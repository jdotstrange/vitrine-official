import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Manrope, JetBrains_Mono, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
})

export const metadata: Metadata = {
  title: {
    default: "Vitrine | Where Collections Come Alive",
    template: "%s | Vitrine",
  },
  description:
    "The premier platform for collectors to catalog, showcase, and connect. Transform your passion into a stunning digital collection.",
  keywords: [
    "collectibles",
    "collection app",
    "catalog",
    "showcase",
    "collectors",
    "trading cards",
    "vinyl",
    "sneakers",
    "vintage",
  ],
  authors: [{ name: "Vitrine" }],
  creator: "Vitrine",
  publisher: "Vitrine",
  metadataBase: new URL("https://vitrine.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vitrine",
    title: "Vitrine | Where Collections Come Alive",
    description: "The premier platform for collectors to catalog, showcase, and connect.",
    images: [
      {
        url: "/OG_image.png",
        width: 1200,
        height: 630,
        alt: "Vitrine - Where Collections Come Alive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitrine | Where Collections Come Alive",
    description: "The premier platform for collectors to catalog, showcase, and connect.",
    images: ["/OG_image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {/* Custom cursor disabled for better UX */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}

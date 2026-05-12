import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  Inter,
  Space_Grotesk,
  Electrolize,
  Libre_Caslon_Text,
  JetBrains_Mono,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk",
})

const electrolize = Electrolize({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-electrolize",
})

const libreCaslonText = Libre_Caslon_Text({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-caslon",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Vitrine — Everything serious collectors deserve.",
    template: "%s | Vitrine",
  },
  description:
    "Catalog, present, track, and transact your collection. Built for serious collectors of cards, watches, comics, sneakers, coins, and beyond.",
  keywords: [
    "collectibles",
    "collection app",
    "catalog",
    "showcase",
    "collectors",
    "trading cards",
    "watches",
    "comics",
    "sneakers",
    "coins",
  ],
  authors: [{ name: "Vitrine" }],
  creator: "Vitrine",
  publisher: "Vitrine",
  metadataBase: new URL("https://vitrine.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vitrine",
    title: "Vitrine — Everything serious collectors deserve.",
    description:
      "Catalog, present, track, and transact your collection. Built for serious collectors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitrine — Everything serious collectors deserve.",
    description:
      "Catalog, present, track, and transact your collection. Built for serious collectors.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
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
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${electrolize.variable} ${libreCaslonText.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

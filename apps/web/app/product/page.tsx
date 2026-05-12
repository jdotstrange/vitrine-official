import type { Metadata } from "next"
import { T } from "@/lib/marketing/tokens"
import { SiteNav, Footer, FinalCTA } from "@/components/marketing/sections"
import {
  ProductHero,
  CatalogArea,
  ShowcaseArea,
  TrackArea,
  ActivityArea,
  ShareArea,
  TradeArea,
  DiscoverArea,
  CategoriesArea,
  ProductFAQ,
  ProductCTA,
} from "@/components/marketing/product"

export const metadata: Metadata = {
  title: "Product — Everything serious collectors deserve.",
  description:
    "Catalog, Showcase, Track, Activity, Share, Trade, Discover, Categories — the full Vitrine toolkit. Eight working surfaces in one app.",
  openGraph: {
    title: "Vitrine Product — Everything serious collectors deserve.",
    description:
      "Catalog, Showcase, Track, Activity, Share, Trade, Discover, Categories. Eight working surfaces, one vault.",
  },
  twitter: {
    title: "Vitrine Product — Everything serious collectors deserve.",
    description:
      "Eight working surfaces, one vault. Catalog. Showcase. Track. Activity. Share. Trade. Discover. Categories.",
  },
}

export default function ProductPage() {
  return (
    <main
      style={{
        background: T.void,
        color: T.fg1,
        fontFamily: T.fontInter,
        minHeight: "100vh",
      }}
    >
      <SiteNav />
      <ProductHero />
      <CatalogArea />
      <ShowcaseArea />
      <TrackArea />
      <ActivityArea />
      <ShareArea />
      <TradeArea />
      <DiscoverArea />
      <CategoriesArea />
      <ProductFAQ />
      <ProductCTA />
      <FinalCTA />
      <Footer />
    </main>
  )
}

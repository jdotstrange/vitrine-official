import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage"

export const metadata: Metadata = {
  title: "Product",
  description:
    "Catalog, Showcase, Track, Activity, Share, Trade, Discover — the full Vitrine toolkit. Everything that ships in the app.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProductPage() {
  return (
    <ComingSoonPage
      kicker="PRODUCT"
      title={
        <>
          The full toolkit,{" "}
          <em
            style={{
              fontFamily: "var(--font-electrolize), system-ui, sans-serif",
              fontStyle: "italic",
              color: "var(--brand-volt)",
            }}
          >
            laid out.
          </em>
        </>
      }
      description={
        <>
          Catalog. Showcase. Track. Activity. Share. Trade. Discover.
          Categories. Every surface in the app, in one page. Real page coming
          in a later phase of the rebuild.
        </>
      }
      cta={{ href: "/", label: "See the overview" }}
    />
  )
}

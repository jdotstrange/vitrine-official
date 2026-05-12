import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three tiers built around the way collectors actually use Vitrine. Free to download, Pro for serious collectors, Collector for power users and sellers.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function PricingPage() {
  return (
    <ComingSoonPage
      kicker="PRICING"
      title={
        <>
          Real pricing,{" "}
          <em
            style={{
              fontFamily: "var(--font-electrolize), system-ui, sans-serif",
              fontStyle: "italic",
              color: "var(--brand-volt)",
            }}
          >
            shipping next.
          </em>
        </>
      }
      description={
        <>
          Three tiers, an &quot;everyone sees the AI reports&quot; keystone, founders
          pricing locked for life, and the math behind marketplace fees. Real
          page coming in the next phase of the rebuild.
        </>
      }
      cta={{ href: "/#download", label: "Get the app" }}
    />
  )
}

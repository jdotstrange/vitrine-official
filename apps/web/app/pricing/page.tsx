import type { Metadata } from "next"
import { T } from "@/lib/marketing/tokens"
import { SiteNav, Footer, FinalCTA, PressSection } from "@/components/marketing/sections"
import {
  PricingHero,
  FoundersPricingBanner,
  PricingCards,
  ViewVsGenerateSection,
  MarketplaceFeeMath,
  ComparisonTable,
  PricingFAQ,
} from "@/components/marketing/pricing"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three tiers built around how collectors actually use Vitrine. Free to download. Pro at $9.99/mo. Collector at $24.99/mo. View any AI report — pay to generate them on your own pieces.",
  openGraph: {
    title: "Vitrine Pricing — Pay nothing to see everything.",
    description:
      "Three tiers built around how collectors actually use Vitrine. View is free. Generate is paid. Founders pricing locked for life for the first 10K Pro users.",
  },
  twitter: {
    title: "Vitrine Pricing — Pay nothing to see everything.",
    description:
      "Three tiers built around how collectors actually use Vitrine. View is free. Generate is paid.",
  },
}

export default function PricingPage() {
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
      <PricingHero />
      <FoundersPricingBanner />
      <PricingCards />
      <ViewVsGenerateSection />
      <MarketplaceFeeMath />
      <ComparisonTable />
      <PricingFAQ />
      <PressSection />
      <FinalCTA />
      <Footer />
    </main>
  )
}

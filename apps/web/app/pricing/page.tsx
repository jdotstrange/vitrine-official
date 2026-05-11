import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PricingHero } from "@/components/pricing/hero"
import { TierSection } from "@/components/pricing/tier-section"
import { ReasoningSection } from "@/components/pricing/reasoning-section"
import { ProPreviewSection } from "@/components/pricing/pro-preview-section"
import { UniversalCta } from "@/components/universal-cta"

export const metadata = {
  title: "Pricing | Vitrine",
  description:
    "Everything in Vitrine is free. No credit card. No item limits. No trial that expires. Catalog, showcases, tracking, comps, community — all included.",
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <PricingHero />
      <TierSection />
      <ReasoningSection />
      <ProPreviewSection />
      <UniversalCta />
      <Footer />
    </main>
  )
}

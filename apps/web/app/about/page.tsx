import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AboutHero } from "@/components/about/hero"
import { StatusQuoSection } from "@/components/about/status-quo-section"
import { CommitmentsSection } from "@/components/about/commitments-section"
import { BeliefsSection } from "@/components/about/beliefs-section"
import { RoadmapSection } from "@/components/about/roadmap-section"
import { UniversalCta } from "@/components/universal-cta"

export const metadata = {
  title: "About | Vitrine",
  description:
    "Vitrine was built by a collector who got tired of managing a serious collection across spreadsheets and dead apps — and decided to build the platform that should have existed all along.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <AboutHero />
      <StatusQuoSection />
      <CommitmentsSection />
      <BeliefsSection />
      <RoadmapSection />
      <UniversalCta />
      <Footer />
    </main>
  )
}

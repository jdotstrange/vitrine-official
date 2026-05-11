import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FeaturesHero } from "@/components/features/hero"
import { CatalogingSection } from "@/components/features/cataloging-section"
import { TwoPathsSection } from "@/components/features/two-paths-section"
import { ShowcasesSection } from "@/components/features/showcases-section"
import { DisplayOptionsSection } from "@/components/features/display-options-section"
import { WatchlistSection } from "@/components/features/watchlist-section"
import { TrackingSection } from "@/components/features/tracking-section"
import { DiscoverySection } from "@/components/features/discovery-section"
import { SharingSection } from "@/components/features/sharing-section"
import { MessagingSection } from "@/components/features/messaging-section"
import { CommunitiesSection } from "@/components/features/communities-section"
import { StatusSystemSection } from "@/components/features/status-system-section"
import { RoadmapSection } from "@/components/features/roadmap-section"
import { UniversalCta } from "@/components/universal-cta"
import { getFieldExamples } from "@/lib/category-data"

export const revalidate = 0

export const metadata = {
  title: "Features | Vitrine",
  description:
    "Dynamic fields per subcategory. Gallery-quality showcases. Consolidated comps. Everything a serious collector manages across six tools — in one.",
}

export default async function FeaturesPage() {
  const fieldExamples = await getFieldExamples(["jersey", "ball", "photo", "ticket", "hat"])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <FeaturesHero />
      <CatalogingSection fieldExamples={fieldExamples} />
      <TwoPathsSection />
      <ShowcasesSection />
      <DisplayOptionsSection />
      <WatchlistSection />
      <TrackingSection />
      <DiscoverySection />
      <SharingSection />
      <MessagingSection />
      <CommunitiesSection />
      <StatusSystemSection />
      <RoadmapSection />
      <UniversalCta />

      <Footer />
    </main>
  )
}

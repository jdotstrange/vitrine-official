import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { ContrastSection } from "@/components/home/contrast-section"
import { FieldDepthSection } from "@/components/home/field-depth-section"
import { CategorySpreadSection } from "@/components/home/category-spread-section"
import { ShowcaseSection } from "@/components/home/showcase-section"
import { IntelligenceSection } from "@/components/home/intelligence-section"
import { CommunitySection } from "@/components/home/community-section"
import { HowItWorksSection } from "@/components/home/how-it-works-section"
import { TrustSection } from "@/components/home/trust-section"
import { UniversalCta } from "@/components/universal-cta"
import { getMosaicImages } from "@/lib/explore-data"
import { getCategoryTypes, getFieldExamples } from "@/lib/category-data"

export const revalidate = 0

export default async function Home() {
  const [mosaicImages, categoryTypes, fieldExamples] = await Promise.all([
    getMosaicImages(30),
    getCategoryTypes(),
    getFieldExamples(["jersey", "ball", "photo", "ticket", "hat"]),
  ])

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-background">
        <HeroSection mosaicImages={mosaicImages} />
        <ContrastSection />
        <FieldDepthSection fieldExamples={fieldExamples} />
        <CategorySpreadSection types={categoryTypes} />
        <ShowcaseSection />
        <IntelligenceSection />
        <CommunitySection />
        <HowItWorksSection />
        <TrustSection />
        <UniversalCta />
      </main>

      <Footer />
    </>
  )
}

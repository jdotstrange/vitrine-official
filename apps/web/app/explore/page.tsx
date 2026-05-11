import { Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ExploreContent } from "@/components/explore/explore-content"
import { UniversalCta } from "@/components/universal-cta"
import { getExploreCollectibles, getExploreCategories } from "@/lib/explore-data"

export const revalidate = 0

export default async function ExplorePage() {
  const [collectibles, categories] = await Promise.all([
    getExploreCollectibles(24),
    getExploreCategories(),
  ])

  return (
    <main className="min-h-screen bg-void-deep">
      <Navigation />
      <Suspense fallback={null}>
        <ExploreContent collectibles={collectibles} categories={categories} />
      </Suspense>
      <UniversalCta />
      <Footer />
    </main>
  )
}

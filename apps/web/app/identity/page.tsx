import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { IdentityPage } from "@/components/identity/identity-page"

export const metadata = {
  title: "Visual Identity | Vitrine",
  description: "Internal design system reference — colors, typography, logos, components.",
  robots: { index: false, follow: false },
}

export default function IdentityRoute() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <IdentityPage />
      <Footer />
    </main>
  )
}

import type { Metadata } from "next"
import { T } from "@/lib/marketing/tokens"
import { SiteNav, Footer, FinalCTA } from "@/components/marketing/sections"
import {
  IntelligenceHero,
  MultiVerticalExamples,
  BeforeAfterComparison,
  CompsArea,
  VARExplanation,
  AARExplanation,
  PulseLensExplanation,
  TechnicalCredibility,
  IntelligenceCTA,
} from "@/components/marketing/intelligence"

export const metadata: Metadata = {
  title: "Looking Glass — Tell us nothing. We read the piece.",
  description:
    "Vitrine's AI extraction engine. Multi-pass classification, attribute extraction, and confidence scoring across 38 collecting categories. Free for every user.",
  openGraph: {
    title: "Looking Glass — Vitrine's AI extraction engine.",
    description:
      "Tell us nothing. We read the piece. Multi-pass extraction across 38 categories. Comps, VAR, AAR, and Pulse all built on the same intelligence layer.",
  },
  twitter: {
    title: "Looking Glass — Vitrine's AI extraction engine.",
    description:
      "Tell us nothing. We read the piece. Multi-pass extraction across 38 categories.",
  },
}

export default function IntelligencePage() {
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
      <IntelligenceHero />
      <MultiVerticalExamples />
      <BeforeAfterComparison />
      <CompsArea />
      <VARExplanation />
      <AARExplanation />
      <PulseLensExplanation />
      <TechnicalCredibility />
      <IntelligenceCTA />
      <FinalCTA />
      <Footer />
    </main>
  )
}

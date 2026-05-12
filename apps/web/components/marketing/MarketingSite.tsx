import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  ExploreSection,
  FinalCTA,
  Footer,
  Hero,
  IntelligenceSection,
  ProblemSection,
  RapidFireFeatures,
  SiteNav,
  ThesisSection,
} from "./sections"

/**
 * MarketingSite — the home page composition (10 narrative sections).
 *
 * Restructured from the original 18-section V3 build into a tight
 * conversion narrative: Hook -> Problem -> Solution -> Wow -> Mechanics ->
 * Depth wall -> Breadth -> Vibe -> Social proof -> Close. Sections that
 * were feature deep-dives migrated to /product, /intelligence, and
 * /pricing in earlier phases of the multi-page restructure.
 */
export function MarketingSite() {
  return (
    <div
      style={{
        background: T.void,
        color: T.fg1,
        fontFamily: T.fontInter,
        width: "100%",
        minHeight: "100%",
      }}
    >
      <SiteNav />
      <Hero />
      <ThesisSection />
      <ProblemSection />
      <RapidFireFeatures />
      <IntelligenceSection />
      <ExploreSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}

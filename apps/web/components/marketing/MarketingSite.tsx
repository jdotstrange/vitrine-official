import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  CommunitySection,
  ExploreSection,
  FinalCTA,
  Footer,
  Hero,
  HowItWorksSection,
  IntelligenceSection,
  PressSection,
  ProblemSection,
  RapidFireFeatures,
  SiteNav,
  ThesisSection,
} from "./sections"

/**
 * MarketingSite — the new home page composition (10 narrative sections).
 *
 * Restructured from the original 18-section V3 build into a tight
 * conversion narrative: Hook -> Problem -> Solution -> Wow -> Mechanics ->
 * Depth wall -> Breadth -> Vibe -> Social proof -> Close. Sections that
 * were feature deep-dives migrated to /product, /intelligence, or
 * /pricing. The frozen 18-section snapshot lives at /lab during the build
 * (see MarketingSiteLab).
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
      <ProblemSection />
      <ThesisSection />
      <IntelligenceSection />
      <HowItWorksSection />
      <RapidFireFeatures />
      <ExploreSection />
      <CommunitySection />
      <PressSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}

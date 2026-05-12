import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  CatalogingSection,
  CategoriesSection,
  CommunitySection,
  ExploreSection,
  FAQSection,
  FinalCTA,
  Footer,
  Hero,
  HowItWorksSection,
  IntelligenceSection,
  LiveComingSection,
  PressSection,
  ProblemSection,
  ProSection,
  PulseSection,
  ShowcasesSection,
  SiteNav,
  ThesisSection,
  TrackingSection,
} from "./sections"
import { CompsArea } from "@/components/marketing/intelligence/CompsArea"

/**
 * MarketingSiteLab — frozen snapshot of the original 18-section V3 build.
 *
 * Mounted at `/lab` during the multi-page restructure as a parts/reference
 * surface so we can mine sections while building the new home + deep pages.
 * The /lab route is `noindex` and the link is removed from public nav at
 * the end of the build.
 */
export function MarketingSiteLab() {
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
      <LabPreviewBanner />
      <SiteNav />
      <Hero />
      <PulseSection />
      <ProblemSection />
      <ThesisSection />
      <IntelligenceSection />
      <CatalogingSection />
      <ShowcasesSection />
      <TrackingSection />
      <CompsArea />
      <CommunitySection />
      <CategoriesSection />
      <HowItWorksSection />
      <LiveComingSection />
      <ExploreSection />
      <ProSection />
      <PressSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function LabPreviewBanner() {
  return (
    <div
      role="note"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 90,
        padding: "8px 16px",
        background: T.volt,
        color: T.void,
        fontFamily: T.fontMono,
        fontSize: 11,
        letterSpacing: 0.6,
        textAlign: "center",
        textTransform: "uppercase",
        borderBottom: `1px solid ${T.void}`,
      }}
    >
      Internal preview · work in progress · not for distribution
    </div>
  )
}

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  CatalogingSection,
  CategoriesSection,
  CommunitySection,
  CompsSection,
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
      <PulseSection />
      <ProblemSection />
      <ThesisSection />
      <IntelligenceSection />
      <CatalogingSection />
      <ShowcasesSection />
      <TrackingSection />
      <CompsSection />
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

import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage"

export const metadata: Metadata = {
  title: "Looking Glass",
  description:
    "Vitrine's AI extraction engine. Tell us nothing. We read the piece. Classification, trait detection, and field extraction across 38 categories.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function IntelligencePage() {
  return (
    <ComingSoonPage
      kicker="LOOKING GLASS"
      title={
        <>
          Tell us nothing.{" "}
          <em
            style={{
              fontFamily: "var(--font-electrolize), system-ui, sans-serif",
              fontStyle: "italic",
              color: "var(--brand-volt)",
            }}
          >
            We read the piece.
          </em>
        </>
      }
      description={
        <>
          Long-form deep-dive on Vitrine&apos;s AI extraction engine — multi-vertical
          examples, the math under VAR and AAR, and what makes Pulse different
          from every other comp tracker. Real page coming in the next phase of
          the rebuild.
        </>
      }
      cta={{ href: "/", label: "See the overview" }}
    />
  )
}

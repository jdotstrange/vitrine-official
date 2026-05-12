import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of Vitrine. Draft pending legal review.",
  robots: {
    index: false,
    follow: false,
  },
}

const SECTIONS: LegalSection[] = [
  {
    title: "What this is",
    body: [
      "This is a placeholder Terms of Service drafted in plain English so prospective users can read our intent before our legal team finalizes the binding text. The principles below are commitments. The exact legal language will appear here on or before launch.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You are responsible for keeping your login credentials secure. You can use Vitrine on as many devices as you want.",
      "Don't impersonate other people, don't pretend to own pieces you don't, and don't list pieces you can't sell.",
    ],
  },
  {
    title: "Your content",
    body: [
      "Your collection content stays yours. By uploading, you grant Vitrine the limited right to store it, display it back to you, render it on shareable URLs you create, and surface it to users you've allowed to view it.",
      "You can revoke any showcase or piece's public visibility at any time. You can export your full collection and delete your account.",
    ],
  },
  {
    title: "Intelligence reports",
    body: [
      "VAR, AAR, Pulse, and Comps reports are informational only and are not appraisals certified for tax, insurance, estate, or legal purposes. We provide the underlying math and citations so the reports are defensible, but you accept that AI-generated valuations carry inherent uncertainty.",
    ],
  },
  {
    title: "Marketplace",
    body: [
      "When you buy, sell, or trade through Vitrine, you agree to the per-transaction marketplace fee published on /pricing. Fee structure: 10% on Free and Pro, 7% on Collector.",
      "Disputes between buyers and sellers are addressed by Vitrine support. We reserve the right to remove listings that violate these terms.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Don't use Vitrine to launder funds, evade sanctions, sell counterfeit pieces, or distribute illegal content.",
      "Don't scrape the platform, abuse the AI extraction APIs beyond fair use limits documented on /pricing, or attempt to circumvent rate limits.",
    ],
  },
  {
    title: "Subscriptions & billing",
    body: [
      "Pro and Collector are paid subscriptions. Annual subscriptions are billed once per year; monthly subscriptions monthly. Switch tiers at any time with prorated credit. Cancel at any time; access continues to the end of your current billing period.",
      "Founders pricing — first 10,000 Pro subscribers — locks the $9.99/mo (or $89/yr) rate to your account for life, even after we raise prices for new cohorts.",
    ],
  },
  {
    title: "Termination",
    body: [
      "You can delete your account at any time. We can suspend accounts that violate these terms, with reasonable notice except in cases of urgent abuse.",
    ],
  },
  {
    title: "Changes",
    body: [
      "When we update these Terms we will notify users by email and in-app at least 30 days before material changes take effect.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Terms questions or disputes: hello@vitrine.app.",
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      kicker="TERMS OF SERVICE"
      title="The agreement."
      effectiveDate="2026-05-12"
      intro={
        <>
          These are the terms that govern your use of Vitrine — written in
          plain English. Our legal team is finalizing the binding language;
          it will appear here before launch. The principles below are firm
          commitments either way.
        </>
      }
      sections={SECTIONS}
    />
  )
}

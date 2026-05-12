import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Vitrine collects, uses, and protects your collection data. Draft pending legal review.",
  robots: {
    index: false,
    follow: false,
  },
}

const SECTIONS: LegalSection[] = [
  {
    title: "What this is",
    body: [
      "This is a placeholder Privacy Policy drafted in plain English so prospective users can read our intent before our legal team finalizes the binding text. The principles below are commitments. The exact legal language will appear here on or before launch.",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Account basics: email address, name, and authentication tokens necessary to sign you in and protect your account.",
      "Collection content: photos, descriptions, fields, and metadata you add to your vault, plus the AI-extracted attributes Looking Glass derives from those photos.",
      "Usage telemetry: anonymized event data (which screens you opened, when, how long, error reports) used to improve the product. No third-party advertising identifiers, no fingerprinting.",
    ],
  },
  {
    title: "How we use your data",
    body: [
      "To run the app: cataloging, search, comps, intelligence reports, sharing, and marketplace transactions you initiate.",
      "To improve the app: aggregated and anonymized analytics; targeted bug-fix telemetry when you opt in.",
      "We do not sell your data. We do not use it for third-party advertising. We do not auto-list your collection.",
    ],
  },
  {
    title: "Sharing & visibility",
    body: [
      "Your collection is private by default. You explicitly choose what to share, with whom, and at what visibility (public / unlisted / private).",
      "When you generate a public showcase URL, the showcase contents become accessible to anyone with the link. You can revoke a public URL at any time.",
    ],
  },
  {
    title: "Data retention & export",
    body: [
      "Your collection lives in your account for as long as the account is active. You can request a full data export at any time (CSV summary on Free, full JSON with AI metadata on Pro and Collector).",
      "You can delete your account and have all associated data permanently removed. Backups are purged within 30 days.",
    ],
  },
  {
    title: "Children",
    body: [
      "Vitrine is not directed at children under 13 and does not knowingly collect data from them.",
    ],
  },
  {
    title: "Changes",
    body: [
      "When we update this Privacy Policy we will notify users by email and in-app at least 30 days before changes take effect for material updates.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Privacy questions, data requests, or account deletion: hello@vitrine.app. Response within 5 business days.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="PRIVACY POLICY"
      title="Your collection. Your data."
      effectiveDate="2026-05-12"
      intro={
        <>
          Vitrine is a vault, not a feed. We treat your collection data with
          the same seriousness you do. This page is a plain-English draft of
          what our forthcoming legally-binding Privacy Policy will commit to.
        </>
      }
      sections={SECTIONS}
    />
  )
}

import type { Metadata } from "next"
import { MarketingSiteLab } from "@/components/marketing/MarketingSiteLab"

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Internal preview of the original 18-section V3 marketing build. Not for distribution.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function LabPage() {
  return <MarketingSiteLab />
}

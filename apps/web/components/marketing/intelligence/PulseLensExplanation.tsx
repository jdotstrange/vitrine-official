import * as React from "react"
import { ReportExplanationCard } from "./ReportExplanationCard"
import { PULSE_EXPLANATION } from "@/lib/marketing/intelligence-data"

/**
 * PulseLensExplanation — explicitly labels this as the per-item PULSE
 * LENS so it doesn't get confused with the marketing "Activity" beat
 * (formerly the marketing-side "Pulse" naming) on the /product page.
 */
export function PulseLensExplanation() {
  return (
    <ReportExplanationCard numberLabel="§03" data={PULSE_EXPLANATION} />
  )
}

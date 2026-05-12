import * as React from "react"
import { ReportExplanationCard } from "./ReportExplanationCard"
import { AAR_EXPLANATION } from "@/lib/marketing/intelligence-data"

export function AARExplanation() {
  return (
    <ReportExplanationCard
      numberLabel="§02"
      data={AAR_EXPLANATION}
      reverse
    />
  )
}

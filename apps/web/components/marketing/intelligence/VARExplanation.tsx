import * as React from "react"
import { ReportExplanationCard } from "./ReportExplanationCard"
import { VAR_EXPLANATION } from "@/lib/marketing/intelligence-data"

export function VARExplanation() {
  return <ReportExplanationCard numberLabel="§01" data={VAR_EXPLANATION} />
}

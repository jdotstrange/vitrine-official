import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "../profile/page"

const TOPICS = [
  {
    title: "Getting started",
    body:
      "Add your first collectible from Catalog → Single Upload. Drop a photo, let the AI identify it, finalize price and visibility.",
  },
  {
    title: "Bulk uploads",
    body:
      "Catalog → Bulk Upload lets you process up to 50 items at once with shared defaults and per-item overrides.",
  },
  {
    title: "Showcases",
    body:
      "Showcases are curated or rule-based collections. Use curated for hand-picked items; managed for live filters.",
  },
  {
    title: "Messages & attachments",
    body:
      "Open Messages to chat with other collectors. Attach a collectible or showcase from any detail page.",
  },
  {
    title: "Activity & tracking",
    body:
      "Tracking lets you watch items you don't own. Activity shows everything that's happened on your collection.",
  },
]

export default function HelpPage() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <Header
        title="Help Center"
        subtitle="Quick answers to the most common questions."
      />

      <div className="mt-8 space-y-3">
        {TOPICS.map((t) => (
          <div
            key={t.title}
            className="rounded-lg border border-frost-border p-4"
          >
            <h3 className="text-fg1 text-sm font-semibold">{t.title}</h3>
            <p className="text-fg2 text-[13px] mt-1">{t.body}</p>
          </div>
        ))}

        <Link
          href="/v/settings/support"
          className="mt-6 inline-flex items-center gap-2 text-fg2 hover:text-fg1 text-sm transition-colors"
        >
          Still need help? Contact support
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

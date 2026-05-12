import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Web app coming soon. For now, use Vitrine on iPhone or Android.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <ComingSoonPage
      kicker="WEB APP"
      title={
        <>
          The web app is{" "}
          <em
            style={{
              fontFamily: "var(--font-electrolize), system-ui, sans-serif",
              fontStyle: "italic",
              color: "var(--brand-volt)",
            }}
          >
            on the way.
          </em>
        </>
      }
      description={
        <>
          For now, your collection lives on iPhone or Android. The web app
          arrives in a later release — same vault, bigger screen.
        </>
      }
      cta={{ href: "/#download", label: "Get the app" }}
    />
  )
}

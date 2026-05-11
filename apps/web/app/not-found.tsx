import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function NotFound() {
  return (
    <>
      <Navigation />

      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        {/* Ambient glow effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
            style={{ background: "var(--gradient-radial-cyan)" }}
          />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <p className="mb-4 font-mono text-6xl text-primary md:text-8xl">404</p>

          {/* Headline */}
          <h1 className="mb-4 font-sans text-3xl font-bold text-foreground md:text-4xl">This page doesn't exist.</h1>

          {/* Subhead */}
          <p className="mb-8 text-muted-foreground">But your collection should. Let's get you back on track.</p>

          {/* CTA */}
          <Link
            href="/"
            className="inline-flex rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-[var(--glow-cyan)]"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  )
}

"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { Check } from "lucide-react"
import { SectionLabel } from "@/components/section-label"

// Inline collectible card that appears in chat
function InlineCollectibleCard() {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-xl border border-primary/30 bg-void-light">
      <div className="relative aspect-[4/3] bg-void-base">
        <img
          src="/placeholder.svg?height=180&width=240"
          alt="Charizard 1st Ed"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Charizard 1st Ed</h4>
            <p className="text-xs text-muted-foreground">PSA 9 • Base Set</p>
          </div>
          <p className="text-sm font-semibold text-primary">$8,200</p>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full bg-void-base" />
          <span>@cardvault</span>
          <span>•</span>
          <span>5.6K tracking</span>
        </div>
      </div>
    </div>
  )
}

// Showcase card that can be attached to chat
function InlineShowcaseCard() {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-void-light p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Showcase</span>
        </div>
        <span className="text-xs text-muted-foreground">@alexcollects</span>
      </div>
      <div className="mb-3 flex -space-x-2">
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-void-light">
          <img src="/placeholder.svg?height=48&width=48" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-void-light">
          <img src="/placeholder.svg?height=48&width=48" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-void-light">
          <img src="/placeholder.svg?height=48&width=48" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-void-light bg-void-base text-xs text-muted-foreground">
          +21
        </div>
      </div>
      <h4 className="font-semibold text-foreground">Grail Collection</h4>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>24 pieces</span>
        <span>$84.2K</span>
      </div>
    </div>
  )
}

export function MessagingSection() {
  const { ref, isVisible } = useScrollReveal()

  const supportingPoints = [
    "Message directly from any listing",
    "Attach collectibles and showcases inline",
    'No more "check my bio" or screenshot chains',
    "Community groups with items dropped right into the chat",
  ]

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-void-deep via-void-base to-void-deep px-6 py-24 md:py-32"
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="mb-4">
                <SectionLabel>Messaging</SectionLabel>
              </div>
              <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Your collection is part of the conversation.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                See something you want? Message the collector directly from the listing. Attach any item or showcase to
                a chat—not a screenshot, not a link, the actual piece from your catalog. This is how collectors should
                talk.
              </p>

              {/* Supporting points */}
              <ul className="mt-8 space-y-3">
                {supportingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Chat UI Mock */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl border border-border bg-void-base p-4 shadow-2xl">
                {/* Chat header */}
                <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-10 w-10 rounded-full bg-void-light" />
                  <div>
                    <p className="font-medium text-foreground">@cardvault</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="space-y-4">
                  {/* Incoming message */}
                  <div className="flex gap-2">
                    <div className="h-6 w-6 flex-shrink-0 rounded-full bg-void-light" />
                    <div className="rounded-2xl rounded-tl-sm bg-void-light px-4 py-2">
                      <p className="text-sm text-foreground">Hey, is this still available?</p>
                    </div>
                  </div>

                  {/* Outgoing message with collectible */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-2">
                      <p className="text-sm text-foreground">Yeah! Here it is:</p>
                    </div>
                    <InlineCollectibleCard />
                  </div>

                  {/* Incoming message */}
                  <div className="flex gap-2">
                    <div className="h-6 w-6 flex-shrink-0 rounded-full bg-void-light" />
                    <div className="rounded-2xl rounded-tl-sm bg-void-light px-4 py-2">
                      <p className="text-sm text-foreground">Wow, nice collection. Got more?</p>
                    </div>
                  </div>

                  {/* Outgoing showcase */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-2">
                      <p className="text-sm text-foreground">Check out my showcase:</p>
                    </div>
                    <InlineShowcaseCard />
                  </div>
                </div>

                {/* Input */}
                <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-void-light px-4 py-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-void-deep">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

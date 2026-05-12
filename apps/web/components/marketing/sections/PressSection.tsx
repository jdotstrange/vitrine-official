import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
} from "@/components/marketing/primitives"
import {
  AUCTION_HOUSE_LOGOS,
  PRESS_QUOTES,
  type Quote,
} from "@/lib/marketing/constants"

export function PressSection() {
  return (
    <section
      data-marketing-section="press"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Kicker color={T.volt} style={{ textAlign: "center" }}>
          §08 &middot; BUILT BY COLLECTORS
        </Kicker>
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 64,
            lineHeight: 0.96,
            letterSpacing: -1.4,
            margin: "20px 0 0",
            textAlign: "center",
            textWrap: "balance",
          }}
        >
          From people who actually{" "}
          <em
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              color: T.volt,
            }}
          >
            own
          </em>{" "}
          the stuff.
        </h2>

        <div
          data-marketing-grid="press-quotes"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginTop: 80,
          }}
        >
          {PRESS_QUOTES.map((q, i) => (
            <QuoteCard key={i} quote={q} />
          ))}
        </div>

        <div
          data-marketing-grid="press-logos"
          style={{
            marginTop: 80,
            paddingTop: 40,
            borderTop: `1px solid ${T.frostDiv}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {AUCTION_HOUSE_LOGOS.map((l) => (
            <span
              key={l}
              style={{
                fontFamily: T.fontCaslon,
                fontStyle: "italic",
                fontSize: 16,
                color: T.fg3,
                letterSpacing: 1,
                opacity: 0.85,
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontFamily: T.fontMono,
            fontSize: 10.5,
            color: T.fg3,
            letterSpacing: 0.5,
          }}
        >
          AUCTION HOUSE &amp; MARKETPLACE INTEGRATIONS
        </div>
      </div>
    </section>
  )
}

interface QuoteCardProps {
  quote: Quote
}

function QuoteCard({ quote }: QuoteCardProps) {
  const isPlaceholder = quote.placeholder === true
  return (
    <FrostCard
      hover={false}
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 240,
        borderStyle: isPlaceholder ? "dashed" : "solid",
        opacity: isPlaceholder ? 0.85 : 1,
        background: isPlaceholder
          ? "rgba(214,235,253,0.01)"
          : undefined,
      }}
    >
      <div
        style={{
          fontFamily: T.fontCaslon,
          fontSize: 22,
          lineHeight: 1.4,
          color: isPlaceholder ? T.fg2 : T.fg1,
          fontStyle: "italic",
        }}
        dangerouslySetInnerHTML={{ __html: `&ldquo;${quote.quote}&rdquo;` }}
      />
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 16,
            letterSpacing: -0.2,
            color: isPlaceholder ? T.fg3 : T.fg1,
          }}
        >
          {quote.name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: T.fontGrotesk,
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: isPlaceholder ? T.volt : T.fg3,
          }}
          dangerouslySetInnerHTML={{ __html: quote.role }}
        />
      </div>
    </FrostCard>
  )
}

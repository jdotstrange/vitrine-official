import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
} from "@/components/marketing/primitives"
import { AUCTION_HOUSE_LOGOS, PRESS_QUOTES } from "@/lib/marketing/constants"

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
          §11 · BUILT BY COLLECTORS
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
            <FrostCard
              key={i}
              hover={false}
              style={{
                padding: 32,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 240,
              }}
            >
              <div
                style={{
                  fontFamily: T.fontCaslon,
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: T.fg1,
                  fontStyle: "italic",
                }}
              >
                &quot;{q.q}&quot;
              </div>
              <Kicker style={{ marginTop: 24 }}>{q.a}</Kicker>
            </FrostCard>
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
          AUCTION HOUSE & MARKETPLACE INTEGRATIONS
        </div>
      </div>
    </section>
  )
}

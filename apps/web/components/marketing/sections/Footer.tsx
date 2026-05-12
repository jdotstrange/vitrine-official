import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { FOOTER_COLUMNS } from "@/lib/marketing/constants"

export function Footer() {
  return (
    <footer
      id="footer"
      data-marketing-section="footer"
      style={{
        padding: "60px 40px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div
        data-marketing-grid="footer-top"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 40,
        }}
      >
        <div>
          <VitrineLogo size={130} />
          <p
            style={{
              fontSize: 12,
              color: T.fg2,
              maxWidth: 280,
              lineHeight: 1.55,
              marginTop: 14,
            }}
          >
            Everything serious collectors deserve. Every piece tells a story.
          </p>
        </div>
        <div
          data-marketing-grid="footer-cols"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, auto)",
            gap: 60,
            fontSize: 12.5,
            color: T.fg2,
          }}
        >
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <Kicker style={{ marginBottom: 16 }}>{col.title}</Kicker>
              {col.items.map((i) => (
                <div
                  key={i}
                  style={{ marginBottom: 10, color: T.fg2, cursor: "pointer" }}
                >
                  {i}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          marginTop: 48,
          paddingTop: 24,
          borderTop: `1px solid ${T.frostDiv}`,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: T.fontMono,
          fontSize: 10.5,
          color: T.fg3,
          letterSpacing: 0.5,
        }}
      >
        <span>© 2026 VITRINE INC.</span>
        <span>BUILT FOR COLLECTORS</span>
      </div>
    </footer>
  )
}

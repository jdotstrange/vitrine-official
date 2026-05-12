import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { FOOTER_COLUMNS, type FooterItem } from "@/lib/marketing/constants"

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
              {col.items.map((item) => (
                <FooterItemLink key={item.label} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        data-marketing-footer-bottom
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
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>© 2026 VITRINE INC.</span>
        <span>BUILT FOR COLLECTORS</span>
      </div>
    </footer>
  )
}

function FooterItemLink({ item }: { item: FooterItem }) {
  const baseStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 10,
    color: T.fg2,
    textDecoration: "none",
    transition: "color 160ms ease",
  }

  if (item.href) {
    return (
      <Link
        href={item.href}
        style={{ ...baseStyle, cursor: "pointer" }}
        className="footer-link"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <span
      style={{
        ...baseStyle,
        color: T.fg3,
        cursor: "default",
      }}
      title="Coming soon"
    >
      {item.label}
    </span>
  )
}

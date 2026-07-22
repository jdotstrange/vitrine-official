import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

const POLICY_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const

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
        <nav
          data-marketing-grid="footer-policy"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 12.5,
          }}
        >
          {POLICY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="footer-link"
              style={{
                color: T.fg2,
                textDecoration: "none",
                transition: "color 160ms ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
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

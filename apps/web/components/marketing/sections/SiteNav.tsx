"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { SITE_NAV_LINKS } from "@/lib/marketing/constants"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { MobileNav } from "@/components/marketing/sections/MobileNav"

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      data-marketing-nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        background: scrolled ? "rgba(0,0,0,0.78)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(150%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(150%)" : "none",
        borderBottom: `1px solid ${scrolled ? T.frostDiv : "transparent"}`,
        transition: "background 200ms, border-color 200ms",
      }}
    >
      <Link
        href="/"
        aria-label="Vitrine home"
        style={{
          color: T.fg1,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <VitrineLogo size={108} />
      </Link>
      <nav
        data-marketing-nav-links
        style={{ display: "flex", gap: 32, fontSize: 13, alignItems: "center" }}
      >
        {SITE_NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            className="nav-link"
            href={link.href}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div
        data-marketing-nav-actions
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <Link
          href="/#download"
          data-marketing-nav-cta
          style={{ textDecoration: "none" }}
        >
          <span
            className="cta-glow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 38,
              padding: "0 18px",
              borderRadius: 9999,
              background: T.volt,
              color: T.void,
              fontFamily: T.fontInter,
              fontWeight: 600,
              fontSize: 12.5,
            }}
          >
            Get the app
          </span>
        </Link>
      </div>
      <MobileNav />
    </header>
  )
}

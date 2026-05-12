"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { useActiveSection } from "@/lib/marketing/hooks"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { MobileNav } from "@/components/marketing/sections/MobileNav"

const NAV_IDS = ["intelligence", "showcases", "tracking", "pro", "explore"]

const NAV_LINKS: { id: string; label: string }[] = [
  { id: "intelligence", label: "Intelligence" },
  { id: "showcases", label: "Showcases" },
  { id: "tracking", label: "Tracking" },
  { id: "pro", label: "Pro" },
  { id: "explore", label: "Explore" },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(NAV_IDS)

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
      <a
        href="#top"
        style={{
          color: T.fg1,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <VitrineLogo size={108} />
      </a>
      <nav
        data-marketing-nav-links
        style={{ display: "flex", gap: 32, fontSize: 13 }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            className="nav-link"
            data-active={active === link.id}
            href={`#${link.id}`}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div
        data-marketing-nav-actions
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <a
          className="nav-link"
          href="#"
          style={{ fontSize: 13 }}
          data-marketing-nav-signin
        >
          Sign in
        </a>
        <a
          href="#download"
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
        </a>
      </div>
      <MobileNav />
    </header>
  )
}

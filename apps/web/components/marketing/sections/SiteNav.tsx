"use client"

import * as React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { T } from "@/lib/marketing/tokens"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { MobileNav } from "@/components/marketing/sections/MobileNav"

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: "/intelligence", label: "Looking Glass" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

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
        {NAV_LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              className="nav-link"
              data-active={active}
              href={link.href}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div
        data-marketing-nav-actions
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <Link
          className="nav-link"
          href="/login"
          style={{ fontSize: 13 }}
          data-marketing-nav-signin
        >
          Sign in
        </Link>
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

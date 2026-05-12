"use client"

import * as React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { T } from "@/lib/marketing/tokens"

interface MobileNavLink {
  href: string
  label: string
  lab?: boolean
}

const NAV_LINKS: MobileNavLink[] = [
  { href: "/intelligence", label: "Looking Glass" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/lab", label: "Lab", lab: true },
]

/**
 * MobileNav — hamburger toggle + slide-down panel that mirrors the
 * desktop nav on small viewports. CSS visibility is controlled by
 * `data-marketing-mobile-nav` rules in globals.css; this component just
 * owns the open/close state and renders both states.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <div data-marketing-mobile-nav data-open={open}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        style={{
          width: 38,
          height: 38,
          borderRadius: 9999,
          border: `1px solid ${T.frostDiv}`,
          background: "transparent",
          color: T.fg1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: "76px 0 0 0",
            zIndex: 70,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            borderTop: `1px solid ${T.frostDiv}`,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            animation: "feedFadeIn 240ms ease-out",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "18px 8px",
                fontFamily: T.fontDisplay,
                fontSize: 28,
                letterSpacing: -0.4,
                color: T.fg1,
                textDecoration: "none",
                borderBottom: `1px solid ${T.frostDiv}`,
              }}
            >
              {link.label}
              {link.lab && (
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 9,
                    letterSpacing: 0.6,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: T.voltFill,
                    color: T.volt,
                    border: `1px solid ${T.voltBorder}`,
                  }}
                >
                  WIP
                </span>
              )}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "18px 8px",
              fontFamily: T.fontGrotesk,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: T.fg2,
              textDecoration: "none",
              marginTop: 8,
            }}
          >
            Sign in
          </Link>
          <Link
            href="/#download"
            onClick={() => setOpen(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              marginTop: 16,
              borderRadius: 9999,
              background: T.volt,
              color: T.void,
              fontFamily: T.fontInter,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Get the app
          </Link>
        </div>
      )}
    </div>
  )
}

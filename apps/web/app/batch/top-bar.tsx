"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, HelpCircle, LogOut, Mail } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

const NAV = [
  { href: "/batch", label: "Upload", match: (p: string) => p === "/batch" },
  {
    href: "/batch/history",
    label: "History",
    match: (p: string) => p.startsWith("/batch/history"),
  },
] as const

export function BatchTopBar() {
  const pathname = usePathname()
  const { profile, user, signOut } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const tier = profile?.tier ?? "free"
  const initial = (
    profile?.display_name ??
    profile?.username ??
    user?.email ??
    "U"
  )
    .charAt(0)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-frost-border bg-void/85 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center gap-6">
        {/* Brand */}
        <Link
          href="/"
          aria-label="Vitrine home"
          className="text-fg1 hover:text-fg1 shrink-0 flex items-center"
        >
          <VitrineLogo size={108} />
        </Link>

        {/* Sub-nav */}
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-brand-volt/[0.10] text-fg1 border border-brand-volt/20"
                    : "text-fg2 hover:text-fg1 hover:bg-frost-border/[0.08] border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Help */}
        <a
          href="mailto:support@myvitrine.app?subject=Bulk%20uploader%20help"
          className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-fg2 hover:text-fg1 transition-colors"
          aria-label="Contact support"
        >
          <HelpCircle size={14} />
          Help
        </a>

        {/* Account dropdown (sign-out only) */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 hover:border-frost-border transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-frost-border/20 flex items-center justify-center shrink-0">
              {profile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-fg2 font-medium">{initial}</span>
              )}
            </div>
            <ChevronDown
              size={12}
              className={`text-fg3 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-frost-border bg-void shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-frost-border/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-fg1 text-sm truncate">
                    {profile?.display_name ?? profile?.username ?? "Collector"}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-frost-border px-2 py-0.5 text-[9px] uppercase tracking-[1.5px] font-grotesk font-bold text-fg2 shrink-0">
                    {tier}
                  </span>
                </div>
                <p className="text-fg3 text-[11px] truncate flex items-center gap-1 mt-0.5">
                  <Mail size={10} />
                  {user?.email ?? ""}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-fg2 hover:text-fg1 hover:bg-frost-border/[0.06] transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

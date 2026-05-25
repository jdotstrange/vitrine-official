"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  KeyRound,
  Shield,
  User,
  UserX,
  Bug,
  Download,
  LifeBuoy,
} from "lucide-react"

const SECTIONS = [
  {
    title: null,
    items: [{ icon: User, label: "Edit Profile", href: "/v/settings/profile" }],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", href: "/v/settings/notifications" },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      { icon: KeyRound, label: "Account", href: "/v/settings/account" },
      { icon: Shield, label: "Privacy", href: "/v/settings/privacy" },
      { icon: UserX, label: "Blocked Users", href: "/v/settings/blocked" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", href: "/v/settings/help" },
      { icon: LifeBuoy, label: "Contact Support", href: "/v/settings/support" },
      { icon: Bug, label: "Report a Bug", href: "/v/settings/bug-report" },
      { icon: Download, label: "Export Data", href: "/v/settings/export" },
    ],
  },
  {
    title: "Legal",
    items: [
      { icon: FileText, label: "Privacy Policy", href: "/v/settings/privacy-policy" },
      { icon: FileText, label: "Terms of Service", href: "/v/settings/terms" },
    ],
  },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex">
      {/* Sub-nav rail */}
      <aside className="w-64 shrink-0 border-r border-frost-border min-h-screen">
        <div className="px-5 py-5 border-b border-frost-border">
          <h2
            className="text-fg1 uppercase"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 16,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            Settings
          </h2>
        </div>
        <nav className="px-3 py-4 space-y-5 overflow-y-auto">
          {SECTIONS.map((section, sIdx) => (
            <div key={section.title ?? `s-${sIdx}`}>
              {section.title && (
                <p className="px-3 mb-2 text-[9px] text-fg3 uppercase tracking-[1.5px] font-grotesk font-bold">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[12.5px] transition-colors ${
                        active
                          ? "bg-brand-volt/[0.08] text-fg1"
                          : "text-fg2 hover:text-fg1 hover:bg-frost-border/[0.06]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-70 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

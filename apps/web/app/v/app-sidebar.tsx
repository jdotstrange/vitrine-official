"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  Compass,
  Layers,
  MessageSquare,
  Radar,
  Upload,
  Users,
  LayoutGrid,
  Bell,
  Search,
} from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useFeeds } from "@/lib/contexts/feeds-context"
import { useSearch } from "@/lib/contexts/search-context"

const NAV_ITEMS = [
  {
    href: "/v",
    label: "Portfolio",
    icon: LayoutGrid,
    children: [
      { href: "/v/collection", label: "Collection" },
      { href: "/v/showcases", label: "Showcases" },
      { href: "/v/activity", label: "Activity" },
      { href: "/v/network", label: "Network" },
    ],
  },
  {
    href: "/v/explore",
    label: "Explore",
    icon: Compass,
    children: [
      { href: "/v/explore/hot", label: "Hot" },
      { href: "/v/explore/new", label: "New" },
      { href: "/v/explore/browse", label: "Browse" },
    ],
  },
  {
    href: "/v/tracking",
    label: "Tracking",
    icon: Radar,
    children: [
      { href: "/v/tracking/tracked", label: "Tracked" },
      { href: "/v/tracking/activity", label: "Activity" },
      { href: "/v/tracking/comps", label: "Comps" },
    ],
  },
  {
    href: "/v/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/v/catalog",
    label: "Catalog",
    icon: Upload,
    children: [
      { href: "/v/catalog/single", label: "Single Upload" },
      { href: "/v/catalog/bulk", label: "Bulk Upload" },
      { href: "/v/catalog/history", label: "History" },
    ],
  },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useUser()
  const { unreadCount, unseenCount } = useFeeds()
  const { open: openSearch } = useSearch()

  return (
    <aside className="w-60 shrink-0 border-r border-frost-border flex flex-col h-screen sticky top-0">
      {/* Brand + bell */}
      <div className="px-5 py-5 border-b border-frost-border flex items-center justify-between">
        <Link href="/v" className="font-grotesk text-lg font-semibold text-fg1">
          Vitrine
        </Link>
        <Link
          href="/v/activity"
          className="relative text-fg2 hover:text-fg1 transition-colors"
          aria-label={`Activity${unseenCount > 0 ? `, ${unseenCount} new` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unseenCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--brand-volt)" }}
            />
          )}
        </Link>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={openSearch}
          className="w-full flex items-center gap-2 rounded-md border border-frost-border/60 px-3 py-2 text-[12px] text-fg3 hover:text-fg1 hover:border-frost-border transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded border border-frost-border/60 bg-frost-border/10 px-1.5 py-0.5 text-[9px] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const { href, label, icon: Icon } = item
          const childPaths =
            "children" in item && item.children
              ? item.children.map((c) => c.href)
              : []
          const isActive =
            href === "/v"
              ? pathname === "/v" || childPaths.some((cp) => pathname.startsWith(cp))
              : pathname.startsWith(href)

          return (
            <div key={href} className="space-y-1">
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-brand-volt/[0.08] text-fg1 border border-brand-volt/15"
                    : "text-fg2 hover:text-fg1 hover:bg-frost-border/[0.08] border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1">{label}</span>
                {label === "Messages" && unreadCount > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-mono leading-none"
                    style={{
                      backgroundColor: "var(--brand-volt)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {"children" in item && item.children && isActive && (
                <div className="relative ml-[22px] pl-4 border-l border-frost-border/40">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/")
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`relative flex items-center gap-2.5 py-[7px] text-[12px] transition-colors ${
                          childActive ? "text-fg1" : "text-fg3 hover:text-fg2"
                        }`}
                      >
                        <span
                          className={`absolute -left-[18.5px] w-[7px] h-[7px] rounded-full border transition-colors ${
                            childActive
                              ? "bg-brand-volt border-brand-volt"
                              : "border-frost-border/60 bg-transparent"
                          }`}
                        />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-frost-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-frost-border/20 flex items-center justify-center">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-fg3 font-medium">
                {(profile?.display_name ?? profile?.username ?? "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg1 truncate">
              {profile?.display_name ?? profile?.username ?? "User"}
            </p>
            <p className="text-[10px] text-fg3 uppercase tracking-wide">
              {profile?.tier ?? "free"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-[10px] text-fg3 hover:text-fg1 transition-colors shrink-0"
          >
            Sign out
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <Link
            href="/v/settings"
            className="flex-1 text-center text-[10px] text-fg3 hover:text-fg1 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}

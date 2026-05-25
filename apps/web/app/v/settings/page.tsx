"use client"

import { useUser } from "@/lib/contexts/user-context"
import { Avatar } from "@/components/vault"

export default function SettingsLanding() {
  const { profile } = useUser()

  return (
    <div className="px-8 py-8">
      <div className="max-w-2xl space-y-8">
        <div>
          <h1
            className="text-fg1 uppercase mb-2"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 28,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            Settings
          </h1>
          <p className="text-fg2 text-sm">
            Manage your profile, privacy, and notification preferences.
          </p>
        </div>

        <div className="rounded-lg border border-frost-border p-6 flex items-center gap-4">
          <Avatar
            src={profile?.avatar ?? undefined}
            name={profile?.display_name ?? profile?.username ?? "U"}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <p className="text-fg1 font-semibold truncate">
              {profile?.display_name ?? "Collector"}
            </p>
            <p className="text-fg3 text-sm truncate">
              @{profile?.username ?? "user"}
            </p>
            <p className="text-fg3 text-[11px] mt-1 uppercase tracking-wider">
              {profile?.tier ?? "free"} tier
            </p>
          </div>
        </div>

        <p className="text-fg3 text-sm">
          Choose a section from the sidebar to get started.
        </p>
      </div>
    </div>
  )
}

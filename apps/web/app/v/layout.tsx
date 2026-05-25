import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserProvider } from "@/lib/contexts/user-context"
import { StreamProvider } from "@/lib/contexts/stream-context"
import { FeedsProvider } from "@/lib/contexts/feeds-context"
import { SearchProvider } from "@/lib/contexts/search-context"
import { AppSidebar } from "./app-sidebar"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profileRow } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("supabase_auth_id", user.id)
    .maybeSingle()

  if (!profileRow?.onboarding_completed_at) {
    redirect("/complete-profile")
  }

  return (
    <UserProvider initialUser={user}>
      <StreamProvider>
        <FeedsProvider>
          <SearchProvider>
            <div className="flex min-h-screen bg-void">
              <AppSidebar />
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </SearchProvider>
        </FeedsProvider>
      </StreamProvider>
    </UserProvider>
  )
}

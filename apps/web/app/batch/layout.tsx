import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserProvider } from "@/lib/contexts/user-context"
import { BatchTopBar } from "./top-bar"

export default async function BatchLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/batch")
  }

  const { data: profileRow } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("supabase_auth_id", user.id)
    .maybeSingle()

  if (!profileRow?.onboarding_completed_at) {
    redirect("/complete-profile?next=/batch")
  }

  return (
    <UserProvider initialUser={user}>
      <div className="min-h-screen bg-void flex flex-col">
        <BatchTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </UserProvider>
  )
}

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { POST_LOGIN_LANDING } from "@/lib/feature-flags"
import { CompleteProfileForm } from "./complete-profile-form"

export const metadata: Metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false },
}

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, username, onboarding_completed_at")
    .eq("supabase_auth_id", user.id)
    .maybeSingle()

  if (profile?.onboarding_completed_at) {
    const params = await searchParams
    redirect(params.next ?? POST_LOGIN_LANDING)
  }

  const params = await searchParams
  return (
    <CompleteProfileForm
      authUserId={user.id}
      email={user.email ?? ""}
      initialDisplayName={profile?.display_name ?? null}
      initialUsername={profile?.username ?? null}
      profileId={profile?.id ?? null}
      redirectTo={params.next ?? POST_LOGIN_LANDING}
    />
  )
}

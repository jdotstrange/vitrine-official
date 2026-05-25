import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { POST_LOGIN_LANDING } from "@/lib/feature-flags"
import { LoginForm } from "../login/login-form"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start your Vitrine collection — sign up for free.",
  robots: { index: false, follow: false },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const params = await searchParams
    redirect(params.next ?? POST_LOGIN_LANDING)
  }

  const params = await searchParams
  return (
    <LoginForm redirectTo={params.next ?? "/complete-profile"} mode="signup" />
  )
}

"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  display_name: string | null
  username: string | null
  tier: "free" | "pro" | "collector"
  avatar: string | null
}

interface UserContextValue {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
})

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    async function loadProfile() {
      // NOTE: tier is not a column on `public.users`. The subscription
      // system isn't wired yet (see cap-counter docs), so we hardcode
      // "free" until the subscription read is in place. See cross-cutting
      // todo in the porting plan.
      const tier: UserProfile["tier"] = "free"

      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, username, avatar")
        .eq("supabase_auth_id", user!.id)
        .maybeSingle()

      if (error) {
        console.warn("[UserProvider] Profile query failed:", error.message)
        setProfile({
          id: user!.id,
          display_name: user!.email?.split("@")[0] ?? null,
          username: null,
          tier,
          avatar: null,
        })
      } else if (data) {
        setProfile({
          id: data.id,
          display_name: data.display_name,
          username: data.username,
          avatar: data.avatar,
          tier,
        })
      } else {
        // No public.users row yet — happens immediately after auth signup
        // before complete-profile runs. Fall back to email-derived shell.
        setProfile({
          id: user!.id,
          display_name: user!.email?.split("@")[0] ?? null,
          username: null,
          tier,
          avatar: null,
        })
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [user, supabase])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <UserContext.Provider value={{ user, profile, isLoading, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

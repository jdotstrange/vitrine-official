/**
 * StreamProvider — wraps the app in a connected Stream Chat client.
 *
 * Mirrors apps/native/lib/contexts/stream-context.tsx but for stream-chat-react
 * instead of stream-chat-expo. Same singleton pattern, same token-refresh
 * via `stream-token` Edge Function, same teardown semantics.
 */

"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import "stream-chat-react/dist/css/index.css"

import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || ""
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let chatClient: StreamChat | null = null

function getChatClient(): StreamChat {
  if (!chatClient && STREAM_API_KEY) {
    chatClient = StreamChat.getInstance(STREAM_API_KEY)
  }
  if (!chatClient) {
    throw new Error(
      "[StreamProvider] NEXT_PUBLIC_STREAM_API_KEY is not configured.",
    )
  }
  return chatClient
}

interface StreamContextValue {
  client: StreamChat | null
  isReady: boolean
  error: string | null
}

const StreamContext = createContext<StreamContextValue>({
  client: null,
  isReady: false,
  error: null,
})

async function fetchStreamToken(
  supabaseJwt: string,
): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stream-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseJwt}`,
      apikey: SUPABASE_ANON_KEY,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as any).error || `stream-token returned ${res.status}`,
    )
  }

  return res.json()
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

interface StreamProviderProps {
  children: ReactNode
}

export function StreamProvider({ children }: StreamProviderProps) {
  const { profile, user } = useUser()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const connectingRef = useRef(false)

  const shouldConnect = !!user?.id && !!profile?.id && !!STREAM_API_KEY

  useEffect(() => {
    if (!STREAM_API_KEY) {
      setError("Stream not configured (missing NEXT_PUBLIC_STREAM_API_KEY)")
      return
    }
    const client = getChatClient()

    if (!shouldConnect) {
      if (client.userID) {
        client.disconnectUser().catch(() => {})
      }
      setIsReady(false)
      return
    }

    if (connectingRef.current) return
    if (client.userID === profile!.id) {
      setIsReady(true)
      return
    }

    let cancelled = false

    async function connect() {
      connectingRef.current = true
      try {
        if (client.userID && client.userID !== profile!.id) {
          await client.disconnectUser()
        }

        const jwt = await getAccessToken()
        if (!jwt || cancelled) return

        const { token, userId } = await fetchStreamToken(jwt)
        if (cancelled) return

        const tokenProvider = async () => {
          const freshJwt = await getAccessToken()
          if (!freshJwt) throw new Error("No Supabase session for token refresh")
          const result = await fetchStreamToken(freshJwt)
          return result.token
        }

        if (client.userID !== userId) {
          await client.connectUser(
            {
              id: userId,
              name: profile!.display_name || profile!.username || "User",
              username: profile!.username || undefined,
              image: profile!.avatar || undefined,
            },
            tokenProvider,
          )
        }

        if (cancelled) {
          await client.disconnectUser()
          return
        }

        setIsReady(true)
        setError(null)
      } catch (err) {
        console.warn("[StreamProvider] connect failed:", err)
        setError(err instanceof Error ? err.message : "Stream connection failed")
      } finally {
        connectingRef.current = false
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [shouldConnect, profile, user])

  const client = STREAM_API_KEY ? getChatClient() : null

  return (
    <StreamContext.Provider value={{ client, isReady, error }}>
      {client && isReady ? (
        <Chat client={client} theme="str-chat__theme-dark">
          {children}
        </Chat>
      ) : (
        children
      )}
    </StreamContext.Provider>
  )
}

export function useStreamChat() {
  return useContext(StreamContext)
}

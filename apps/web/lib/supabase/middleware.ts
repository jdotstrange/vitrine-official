import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const WEB_FULL_EXPERIENCE =
  process.env.NEXT_PUBLIC_WEB_FULL_EXPERIENCE === "true"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Feature-flag firewall: when the full app is dark, the only authenticated
  // surface is /batch. Direct hits to /v/* (and /batch/* for unauth users)
  // get redirected.
  //
  // We do this BEFORE reading the auth cookie because the redirect target
  // doesn't depend on auth state — `/v/*` is dark for everyone in dark mode.
  if (
    !WEB_FULL_EXPERIENCE &&
    request.nextUrl.pathname.startsWith("/v")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/batch"
    url.search = ""
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth gate for protected surfaces.
  const path = request.nextUrl.pathname
  const isProtected =
    path.startsWith("/v") || path.startsWith("/batch")

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", path)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

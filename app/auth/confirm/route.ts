import { createServerClient } from "@supabase/ssr"
import { type EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { seedNewUser } from "@/lib/supabase/seed"

const buildAppRedirect = (origin: string, pathname: string, params?: Record<string, string>) => {
  const url = new URL(pathname, origin)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const token = searchParams.get("token")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"
  const flow = searchParams.get("flow")
  const errorDescription = searchParams.get("error_description")

  if (errorDescription) {
    return NextResponse.redirect(
      buildAppRedirect(origin, "/login", {
        error: errorDescription,
      }),
    )
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(buildAppRedirect(origin, next))
  let cookiesWereSet = false

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesWereSet = true
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await seedNewUser(supabase, user)
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[Confirm] Cookies set on code exchange response:",
          response.cookies.getAll().map((c) => c.name),
        )
        console.log("[Confirm] Cookie adapter setAll called:", cookiesWereSet)
      }

      return response
    }

    if (flow === "signup") {
      return NextResponse.redirect(
        buildAppRedirect(origin, "/login", {
          message: "email-confirmed",
        }),
      )
    }
  }

  const resolvedTokenHash = token_hash ?? token

  if (resolvedTokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: resolvedTokenHash,
    })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await seedNewUser(supabase, user)
      }

      if (flow === "signup" && !user) {
        return NextResponse.redirect(
          buildAppRedirect(origin, "/login", {
            message: "email-confirmed",
          }),
        )
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[Confirm] Cookies set on verify response:",
          response.cookies.getAll().map((c) => c.name),
        )
        console.log("[Confirm] Cookie adapter setAll called:", cookiesWereSet)
      }

      return response
    }
  }

  return NextResponse.redirect(
    buildAppRedirect(origin, "/login", {
      error:
        flow === "recovery"
          ? "Invalid or expired reset link. Please request a new password reset email."
          : flow === "magiclink"
            ? "Invalid or expired sign-in link. Please request a new magic link."
            : "Invalid or expired token",
    }),
  )
}

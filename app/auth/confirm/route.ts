import { createServerClient } from "@supabase/ssr"
import { type EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { seedNewUser } from "@/lib/supabase/seed"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash && type) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}${next}`)
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Fetch the user data using the same client to trigger session/cookies and run seeding
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await seedNewUser(supabase, user)
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[Confirm] Cookies set on confirm response:",
          response.cookies.getAll().map((c) => c.name),
        )
        console.log("[Confirm] Cookie adapter setAll called:", cookiesWereSet)
      }
      return response
    }
  }

  // Redirect to login page with an error parameter if validation failed
  return NextResponse.redirect(`${origin}/login?error=Invalid or expired token`)
}

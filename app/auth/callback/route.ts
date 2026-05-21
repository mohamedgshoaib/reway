import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { seedNewUser } from "@/lib/supabase/seed"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If setAll wasn't called during exchange, force it with getUser
      if (!cookiesWereSet) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await seedNewUser(supabase, user)
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await seedNewUser(supabase, user)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[Callback] Cookies set on response:",
          response.cookies.getAll().map((c) => c.name),
        )
      }
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}

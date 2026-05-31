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

function redirectToLogin(origin: string, params: Record<string, string>) {
  return NextResponse.redirect(buildAppRedirect(origin, "/login", params))
}

async function seedCurrentUser(
  supabase: ReturnType<typeof createServerClient>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await seedNewUser(supabase, user)
  }

  return user
}

function logCookieState(
  label: string,
  response: NextResponse,
  cookiesWereSet: boolean,
) {
  if (process.env.NODE_ENV === "production") return

  console.log(
    `[Confirm] Cookies set on ${label} response:`,
    response.cookies.getAll().map((c) => c.name),
  )
  console.log("[Confirm] Cookie adapter setAll called:", cookiesWereSet)
}

async function handleCodeFlow({
  supabase,
  code,
  flow,
  origin,
  response,
  cookiesWereSet,
}: {
  supabase: ReturnType<typeof createServerClient>
  code: string
  flow: string | null
  origin: string
  response: NextResponse
  cookiesWereSet: boolean
}) {
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (!error) {
    await seedCurrentUser(supabase)
    logCookieState("code exchange", response, cookiesWereSet)
    return response
  }

  if (flow === "signup") {
    return redirectToLogin(origin, {
      message: "email-confirmed",
    })
  }

  return null
}

async function handleOtpFlow({
  supabase,
  tokenHash,
  type,
  flow,
  origin,
  response,
  cookiesWereSet,
}: {
  supabase: ReturnType<typeof createServerClient>
  tokenHash: string
  type: EmailOtpType
  flow: string | null
  origin: string
  response: NextResponse
  cookiesWereSet: boolean
}) {
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    return null
  }

  const user = await seedCurrentUser(supabase)

  if (flow === "signup" && !user) {
    return redirectToLogin(origin, {
      message: "email-confirmed",
    })
  }

  logCookieState("verify", response, cookiesWereSet)
  return response
}

function getInvalidTokenMessage(flow: string | null) {
  if (flow === "recovery") {
    return "Invalid or expired reset link. Please request a new password reset email."
  }

  if (flow === "magiclink") {
    return "Invalid or expired sign-in link. Please request a new magic link."
  }

  return "Invalid or expired token"
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
    return redirectToLogin(origin, {
      error: errorDescription,
    })
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
    const codeResult = await handleCodeFlow({
      supabase,
      code,
      flow,
      origin,
      response,
      cookiesWereSet,
    })
    if (codeResult) {
      return codeResult
    }
  }

  const resolvedTokenHash = token_hash ?? token

  if (resolvedTokenHash && type) {
    const otpResult = await handleOtpFlow({
      supabase,
      tokenHash: resolvedTokenHash,
      type,
      flow,
      origin,
      response,
      cookiesWereSet,
    })
    if (otpResult) {
      return otpResult
    }
  }

  return redirectToLogin(origin, {
    error: getInvalidTokenMessage(flow),
  })
}

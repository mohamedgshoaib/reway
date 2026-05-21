"use server"

import { redirect } from "next/navigation"
import { after } from "next/server"
import { seedNewUser } from "@/lib/supabase/seed"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type ActionResponse = {
  success: boolean
  message?: string
  error?: string
}

const normalizeSiteUrl = (raw: string) => {
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!trimmed) return "http://localhost:3000"
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

const getSiteUrl = () => {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL
  if (fromPublic?.trim()) return normalizeSiteUrl(fromPublic)

  const fromVercel = process.env.VERCEL_URL
  if (fromVercel?.trim()) return normalizeSiteUrl(fromVercel)

  return "http://localhost:3000"
}

const logDev = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    // react-doctor-disable-next-line react-doctor/server-after-nonblocking
    after(() => console.log(...args))
  }
}

const buildAuthConfirmUrl = (siteUrl: string, next: string, flow: "signup" | "magiclink" | "recovery") =>
  `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}&flow=${flow}`

const passwordMeetsRequirements = (password: string) => {
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(password)
  return password.length >= 8 && hasLowercase && hasUppercase && hasNumber && hasSpecial
}

const getFriendlyAuthError = (message: string) => {
  if (message === "Invalid login credentials") {
    return "Incorrect password or this email address does not exist. Please check your credentials or create an account."
  }

  if (
    message.includes("email rate limit exceeded") ||
    message.includes("over_email_send_rate_limit") ||
    message.includes("security purposes")
  ) {
    return "Too many email requests were sent recently. Please wait a minute and try again."
  }

  if (message.includes("Password should contain at least one character of each")) {
    return "Password is too weak. It must contain at least one lowercase letter, one uppercase letter, one number, and one special character."
  }

  return message
}

const getEmailSendErrorMessage = (message: string) => {
  const friendly = getFriendlyAuthError(message)

  if (friendly !== message) {
    return friendly
  }

  return "We couldn't send the email right now. Please try again in a minute."
}

const findAuthUserByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (page <= 5) {
    const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

    if (result.error) {
      throw result.error
    }

    const foundUser = result.data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail)

    if (foundUser) {
      return foundUser
    }

    if (result.data.users.length < perPage) {
      break
    }

    page += 1
  }

  return null
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient()
  const siteUrl = getSiteUrl()
  logDev("[Auth] signInWithGoogle redirectTo:", `${siteUrl}/auth/callback`)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error("Error signing in with Google:", error)
    return
  }

  if (data.url) {
    redirect(data.url as never)
  }
}

export async function signInWithPasswordAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string
  const password = formData.get("password") as string
  const email = emailInput?.trim().toLowerCase()

  if (!email || !password) {
    return { success: false, error: "Email and password are required." }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let friendlyError = error.message
    friendlyError = getFriendlyAuthError(error.message)
    return { success: false, error: friendlyError }
  }

  if (data.user) {
    await seedNewUser(supabase, data.user)
  }

  redirect("/dashboard")
}

export async function signUpWithPasswordAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const fullName = formData.get("fullName") as string
  const emailInput = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const email = emailInput?.trim().toLowerCase()

  if (!fullName) {
    return { success: false, error: "Full name is required." }
  }

  if (!email || !password || !confirmPassword) {
    return { success: false, error: "All fields are required." }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  if (!passwordMeetsRequirements(password)) {
    return {
      success: false,
      error:
        "Password must be at least 8 characters and include lowercase, uppercase, number, and symbol.",
    }
  }

  const supabase = await createClient()
  const siteUrl = getSiteUrl()
  const confirmUrl = buildAuthConfirmUrl(siteUrl, "/dashboard", "signup")
  logDev("[Auth] signUpWithPassword emailRedirectTo:", confirmUrl)

  let existingUser = null

  try {
    existingUser = await findAuthUserByEmail(email)
  } catch (error) {
    console.error("Error checking existing auth user during signup:", error)
  }

  if (existingUser?.email_confirmed_at) {
    return {
      success: false,
      error: "An account with this email already exists. Sign in instead or use Forgot password.",
    }
  }

  if (existingUser) {
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: fullName,
      },
    })

    if (updateUserError) {
      return { success: false, error: getFriendlyAuthError(updateUserError.message) }
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: confirmUrl,
      },
    })

    if (resendError) {
      return { success: false, error: getFriendlyAuthError(resendError.message) }
    }

    return {
      success: true,
      message:
        "Confirmation email resent. Check your inbox (and spam) to verify your email and finish creating your account.",
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    const friendlyError = getFriendlyAuthError(error.message)
    logDev("[Auth] signUpWithPassword error:", friendlyError)
    return { success: false, error: friendlyError }
  }

  // If a session exists, the user was auto-confirmed (common in local dev / custom configs)
  if (data.session) {
    logDev("[Auth] signUpWithPassword auto-confirmed session present")
    if (data.user) {
      await seedNewUser(supabase, data.user)
    }
    redirect("/dashboard")
  }

  logDev("[Auth] signUpWithPassword email confirmation required (no session)")
  return {
    success: true,
    message:
      "Account created. Check your inbox (and spam) to verify your email. If you don’t receive it, try again in a minute.",
  }
}

export async function signInWithMagicLinkAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string
  const email = emailInput?.trim().toLowerCase()

  if (!email) {
    return { success: false, error: "Email address is required." }
  }

  const supabase = await createClient()
  const siteUrl = getSiteUrl()
  const confirmUrl = buildAuthConfirmUrl(siteUrl, "/dashboard", "magiclink")
  logDev("[Auth] magicLink emailRedirectTo:", confirmUrl)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: confirmUrl,
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error("Error sending magic link:", error)
    return { success: false, error: getEmailSendErrorMessage(error.message) }
  }

  return {
    success: true,
    message: "If an account exists, we've sent a link.",
  }
}

export async function sendResetPasswordEmailAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string
  const email = emailInput?.trim().toLowerCase()

  if (!email) {
    return { success: false, error: "Email address is required." }
  }

  const supabase = await createClient()
  const siteUrl = getSiteUrl()
  const confirmUrl = buildAuthConfirmUrl(siteUrl, "/reset-password", "recovery")
  logDev("[Auth] resetPassword redirectTo:", confirmUrl)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl,
  })

  if (error) {
    console.error("Error sending reset password email:", error)
    return { success: false, error: getEmailSendErrorMessage(error.message) }
  }

  return {
    success: true,
    message: "If an account exists, we've sent a link.",
  }
}

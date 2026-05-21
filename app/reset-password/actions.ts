"use server"

import { redirect } from "next/navigation"
import { ActionResponse } from "@/app/login/actions"
import { createClient } from "@/lib/supabase/server"

const passwordMeetsRequirements = (password: string) => {
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(password)
  return password.length >= 8 && hasLowercase && hasUppercase && hasNumber && hasSpecial
}

export async function updatePasswordAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || !confirmPassword) {
    return { success: false, error: "Please fill in all fields." }
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  redirect("/dashboard")
}

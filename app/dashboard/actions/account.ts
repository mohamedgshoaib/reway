"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const userId = userData.user.id

  const deleteResults = await Promise.all([
    supabaseAdmin.from("bookmarks").delete().eq("user_id", userId),
    supabaseAdmin.from("groups").delete().eq("user_id", userId),
  ])

  for (const result of deleteResults) {
    if (result.error) {
      throw new Error(result.error.message)
    }
  }

  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (deleteUserError) {
    throw new Error(deleteUserError.message)
  }

  await supabase.auth.signOut()

  return { success: true }
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export async function getUser(): Promise<User> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    redirect("/login")
  }

  return {
    id: data.user.id,
    email: data.user.email || "",
    name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
    avatar_url: data.user.user_metadata?.avatar_url,
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Fetch user on the server to ensure authentication
  await getUser()

  return <>{children}</>
}

import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "./LoginForm"

export const metadata = {
  title: "Login",
  description: "Sign in to your Reway account to access your personal bookmark library.",
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-background p-6">
      {/* Top action: Back to homepage */}
      <div className="flex justify-start">
        <Button asChild variant="secondary" size="sm" className="rounded-3xl cursor-pointer">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center py-12">
        <LoginForm />
      </main>

      {/* Empty div for bottom vertical alignment spacing */}
      <div />
    </div>
  )
}

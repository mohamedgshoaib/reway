import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Reset Password",
  description: "Set a new password for your Reway account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/login?error=Session expired. Please request a new password reset link.");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <main className="w-full max-w-md">
        <ResetPasswordForm />
      </main>
    </div>
  );
}

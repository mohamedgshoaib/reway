"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActionResponse } from "@/app/login/actions";

const passwordMeetsRequirements = (password: string) => {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(password);
  return (
    password.length >= 8 &&
    hasLowercase &&
    hasUppercase &&
    hasNumber &&
    hasSpecial
  );
};

export async function updatePasswordAction(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { success: false, error: "Please fill in all fields." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  if (!passwordMeetsRequirements(password)) {
    return {
      success: false,
      error:
        "Password must be at least 8 characters and include lowercase, uppercase, number, and symbol.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/dashboard");
}

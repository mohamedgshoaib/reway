"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seedNewUser } from "@/lib/supabase/seed";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

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

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    return;
  }

  if (data.url) {
    redirect(data.url as never);
  }
}

export async function signInWithPasswordAction(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string;
  const password = formData.get("password") as string;
  const email = emailInput?.trim().toLowerCase();

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let friendlyError = error.message;
    if (error.message === "Invalid login credentials") {
      friendlyError =
        "Incorrect password or this email address does not exist. Please check your credentials or create an account.";
    }
    return { success: false, error: friendlyError };
  }

  if (data.user) {
    await seedNewUser(supabase, data.user);
  }

  redirect("/dashboard");
}

export async function signUpWithPasswordAction(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  const fullName = formData.get("fullName") as string;
  const emailInput = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const email = emailInput?.trim().toLowerCase();

  if (!fullName) {
    return { success: false, error: "Full name is required." };
  }

  if (!email || !password || !confirmPassword) {
    return { success: false, error: "All fields are required." };
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
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    let friendlyError = error.message;
    if (
      error.message.includes(
        "Password should contain at least one character of each",
      )
    ) {
      friendlyError =
        "Password is too weak. It must contain at least one lowercase letter, one uppercase letter, one number, and one special character.";
    }
    return { success: false, error: friendlyError };
  }

  // If a session exists, the user was auto-confirmed (common in local dev / custom configs)
  if (data.session) {
    if (data.user) {
      await seedNewUser(supabase, data.user);
    }
    redirect("/dashboard");
  }

  return {
    success: true,
    message:
      "Account created successfully! Please check your email to verify your account.",
  };
}

export async function signInWithMagicLinkAction(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string;
  const email = emailInput?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Error sending magic link:", error);
  }

  return {
    success: true,
    message: "If an account exists, we've sent a link.",
  };
}

export async function sendResetPasswordEmailAction(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  const emailInput = formData.get("email") as string;
  const email = emailInput?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    console.error("Error sending reset password email:", error);
  }

  return {
    success: true,
    message: "If an account exists, we've sent a link.",
  };
}

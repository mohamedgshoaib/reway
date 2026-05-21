"use client";

import { useActionState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "./actions";
import { ActionResponse } from "@/app/login/actions";

const initialState: ActionResponse = {
  success: false,
  error: undefined,
  message: undefined,
};

export function ResetPasswordForm() {
  const shouldReduceMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.26, ease: "easeOut" }
      }
      suppressHydrationWarning
      className="space-y-8"
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground">
          Enter your new password below to update your account.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div
            className="p-3 text-sm text-destructive bg-destructive/10 rounded-2xl border border-destructive/20"
            role="alert"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            disabled={isPending}
            className="rounded-3xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            required
            disabled={isPending}
            className="rounded-3xl"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-3xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
          disabled={isPending}
        >
          {isPending ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </motion.div>
  );
}

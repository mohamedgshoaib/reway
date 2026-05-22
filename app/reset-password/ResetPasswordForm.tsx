"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { startTransition, useActionState } from "react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { ActionResponse } from "@/app/login/actions"
import { ConfirmPasswordField, PasswordField } from "@/components/auth/PasswordFields"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Button } from "@/components/ui/button"
import { getPasswordStrength, passwordSchema } from "@/lib/auth/password-validation"
import { updatePasswordAction } from "./actions"

type ResetPasswordValues = {
  password: string
  confirmPassword: string
}

const initialState: ActionResponse = {
  success: false,
  error: undefined,
  message: undefined,
}

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      })
    }
  })

export function ResetPasswordForm() {
  const shouldReduceMotion = useReducedMotion()
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const password = useWatch({ control: form.control, name: "password" }) ?? ""
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" }) ?? ""
  const strength = getPasswordStrength(password)
  const isValidationPassing = strength.score === 4 && strength.isLongEnough
  const isSubmitDisabled = isPending || !isValidationPassing || password !== confirmPassword

  const handleSubmit = form.handleSubmit((values) => {
    const formData = new FormData()
    formData.set("password", values.password)
    formData.set("confirmPassword", values.confirmPassword)

    startTransition(() => {
      void formAction(formData)
    })
  })

  return (
    <RewayLazyMotion>
      <m.div
        initial={{ opacity: 0, transform: "translateY(10px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
        suppressHydrationWarning
        className="space-y-6"
      >
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below to update your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {state?.error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 rounded-2xl border border-destructive/20"
              role="alert"
            >
              {state.error}
            </div>
          )}

          <AnimatePresence initial={false}>
            <m.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 0 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
              }
              className="overflow-visible px-2 -mx-2 py-1 -my-1 space-y-1.5 relative z-30"
            >
              <PasswordField
                control={form.control}
                name="password"
                label="New Password"
                placeholder="Minimum 8 characters"
                required
                disabled={isPending}
                showRequirements
              />
            </m.div>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            <m.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
              }
              className="overflow-visible px-2 -mx-2 py-1 -my-1 space-y-1.5 relative z-20"
            >
              <ConfirmPasswordField
                control={form.control}
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Confirm your new password"
                required
                disabled={isPending}
              />
            </m.div>
          </AnimatePresence>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-3xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
            disabled={isSubmitDisabled}
          >
            {isPending ? "Updating password…" : "Update password"}
          </Button>
        </form>
      </m.div>
    </RewayLazyMotion>
  )
}

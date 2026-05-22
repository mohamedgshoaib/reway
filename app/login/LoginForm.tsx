"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { useSearchParams } from "next/navigation"
import { startTransition, useActionState, useState, useEffect, Suspense, useMemo } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { ConfirmPasswordField, PasswordField } from "@/components/auth/PasswordFields"
import { Google } from "@/components/google-logo"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getPasswordStrength, passwordSchema } from "@/lib/auth/password-validation"
import {
  signInWithGoogle,
  signInWithPasswordAction,
  signUpWithPasswordAction,
  signInWithMagicLinkAction,
  sendResetPasswordEmailAction,
  ActionResponse,
} from "./actions"

type AuthMode = "signin" | "signup" | "magiclink" | "forgotpassword"

type LoginFormValues = {
  fullName?: string
  email: string
  password?: string
  confirmPassword?: string
}

const initialState: ActionResponse = {
  success: false,
  error: undefined,
  message: undefined,
}

const emailSchema = z
  .string()
  .min(1, { message: "Email address is required." })
  .email({ message: "Enter a valid email address." })

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required." }),
})

const signUpSchema = z
  .object({
    fullName: z.string().min(1, { message: "Full name is required." }),
    email: emailSchema,
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

const magicLinkSchema = z.object({
  email: emailSchema,
})

const forgotPasswordSchema = z.object({
  email: emailSchema,
})

function LoginFormContent() {
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  // Mode state
  const [mode, setMode] = useState<AuthMode>("signin")

  // Password visibility states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Form states and actions
  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPasswordAction,
    initialState,
  )
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPasswordAction,
    initialState,
  )
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    signInWithMagicLinkAction,
    initialState,
  )
  const [forgotPasswordState, forgotPasswordAction, forgotPasswordPending] = useActionState(
    sendResetPasswordEmailAction,
    initialState,
  )

  const [googlePending, setGooglePending] = useState(false)

  // Read URL query errors (like verification expiry)
  const urlError = searchParams.get("error")
  const urlMessage = searchParams.get("message")
  const [activeUrlError, setActiveUrlError] = useState<string | null>(urlError)
  const [activeUrlMessage, setActiveUrlMessage] = useState<string | null>(urlMessage)

  const schema = useMemo(() => {
    switch (mode) {
      case "signup":
        return signUpSchema
      case "magiclink":
        return magicLinkSchema
      case "forgotpassword":
        return forgotPasswordSchema
      case "signin":
      default:
        return signInSchema
    }
  }, [mode])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = useWatch({ control: form.control, name: "password" }) ?? ""
  const confirmPassword = useWatch({ control: form.control, name: "confirmPassword" }) ?? ""

  // Clear errors/messages/password visibilities on mode switch
  useEffect(() => {
    setActiveUrlError(null)
    setActiveUrlMessage(null)
    setShowSuccessMessage(false)
    const existingEmail = form.getValues("email") || ""
    form.reset({
      fullName: "",
      email: existingEmail,
      password: "",
      confirmPassword: "",
    })
    form.clearErrors()
  }, [mode, form])

  const isAnyPending =
    signInPending || signUpPending || magicLinkPending || forgotPasswordPending || googlePending

  // Determine active form action, state, and pending status based on mode
  const getActiveFormConfig = () => {
    switch (mode) {
      case "signin":
        return {
          action: signInAction,
          state: signInState,
          pending: signInPending,
          title: "Welcome back",
          subtitle: "Sign in to your account to manage your bookmarks",
          submitText: "Sign In",
          submitPendingText: "Signing in…",
        }
      case "signup":
        return {
          action: signUpAction,
          state: signUpState,
          pending: signUpPending,
          title: "Create an account",
          subtitle: "Get started with Reway to save and organize bookmarks",
          submitText: "Create Account",
          submitPendingText: "Creating account…",
        }
      case "magiclink":
        return {
          action: magicLinkAction,
          state: magicLinkState,
          pending: magicLinkPending,
          title: "Sign in with Magic Link",
          subtitle: "We'll send a secure passwordless login link to your inbox",
          submitText: "Send Magic Link",
          submitPendingText: "Sending link…",
        }
      case "forgotpassword":
        return {
          action: forgotPasswordAction,
          state: forgotPasswordState,
          pending: forgotPasswordPending,
          title: "Reset Password",
          subtitle: "Enter your email to receive a password reset link",
          submitText: "Send Reset Link",
          submitPendingText: "Sending link…",
        }
    }
  }

  const { action, state, pending, title, subtitle, submitText, submitPendingText } =
    getActiveFormConfig()

  useEffect(() => {
    if (state?.message) {
      setShowSuccessMessage(true)
    }
  }, [state?.message])

  const strength = getPasswordStrength(password)

  // Real-time button disabling validation
  const isValidationPassing = strength.score === 4 && strength.isLongEnough

  const isSubmitDisabled =
    isAnyPending || (mode === "signup" && (!isValidationPassing || password !== confirmPassword))

  const handleSubmit = form.handleSubmit((values) => {
    const formData = new FormData()
    const trimmedEmail = values.email?.trim() ?? ""
    if (trimmedEmail) {
      formData.set("email", trimmedEmail)
    }

    if (mode === "signin" || mode === "signup") {
      if (values.password) {
        formData.set("password", values.password)
      }
    }

    if (mode === "signup") {
      if (values.fullName) {
        formData.set("fullName", values.fullName.trim())
      }
      if (values.confirmPassword) {
        formData.set("confirmPassword", values.confirmPassword)
      }
    }

    startTransition(() => {
      void action(formData)
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
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error / Success alert messages */}
          {activeUrlError && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 rounded-2xl border border-destructive/20"
              role="alert"
            >
              {activeUrlError}
            </div>
          )}

          {state?.error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 rounded-2xl border border-destructive/20"
              role="alert"
            >
              {state.error}
            </div>
          )}

          {activeUrlMessage === "email-confirmed" && (
            <div
              className="p-3 text-sm text-emerald-600 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 dark:text-emerald-400"
              role="status"
            >
              Email confirmed. You can sign in now.
            </div>
          )}

          {state?.message && showSuccessMessage && (
            <div
              className="p-3 text-sm text-emerald-600 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 dark:text-emerald-400"
              role="status"
            >
              {state.message}
            </div>
          )}

          <div>
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <m.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
                  }
                  className="overflow-hidden px-2 -mx-2 py-1 -my-1 space-y-1.5 relative z-10"
                >
                  <Controller
                    name="fullName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        data-disabled={isAnyPending}
                        className="gap-1.5"
                      >
                        <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                        <Input
                          {...field}
                          id="fullName"
                          type="text"
                          placeholder="Jane Doe"
                          required={mode === "signup"}
                          disabled={isAnyPending}
                          className="rounded-3xl"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </m.div>
              )}
            </AnimatePresence>

            <div className="relative z-10">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    data-disabled={isAnyPending}
                    className="gap-1.5"
                  >
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      disabled={isAnyPending}
                      className="rounded-3xl"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <AnimatePresence initial={false}>
              {(mode === "signin" || mode === "signup") && (
                <m.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 16 }}
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
                    label="Password"
                    placeholder="••••••••"
                    required={mode === "signin" || mode === "signup"}
                    disabled={isAnyPending}
                    showRequirements={mode === "signup"}
                  />
                </m.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {mode === "signup" && (
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
                    label="Confirm Password"
                    placeholder="••••••••"
                    required={mode === "signup"}
                    disabled={isAnyPending}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-3xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
            disabled={isSubmitDisabled}
          >
            {pending ? submitPendingText : submitText}
          </Button>

          {/* Mode Toggles */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-2 text-sm text-muted-foreground px-1">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  disabled={isAnyPending}
                  className="hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Need an account? Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setMode("forgotpassword")}
                  disabled={isAnyPending}
                  className="hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </>
            )}

            {mode === "signup" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                disabled={isAnyPending}
                className="hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 mx-auto"
              >
                Already have an account? Sign In
              </button>
            )}

            {mode === "magiclink" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                disabled={isAnyPending}
                className="hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 mx-auto"
              >
                Sign in with Password
              </button>
            )}

            {mode === "forgotpassword" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                disabled={isAnyPending}
                className="hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 mx-auto"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        {/* Alternative Login Methods Separator & Buttons */}
        {mode !== "forgotpassword" && (
          <div className="space-y-4 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground">
                Or continue with
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="flex flex-col gap-3">
              {mode !== "magiclink" && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setMode("magiclink")}
                  disabled={isAnyPending}
                  className="w-full rounded-3xl cursor-pointer"
                >
                  Email Magic Link (Passwordless)
                </Button>
              )}

              {mode === "magiclink" && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setMode("signin")}
                  disabled={isAnyPending}
                  className="w-full rounded-3xl cursor-pointer"
                >
                  Email and Password
                </Button>
              )}

              <form
                action={signInWithGoogle}
                className="w-full"
                onSubmit={() => setGooglePending(true)}
              >
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="w-full rounded-3xl cursor-pointer"
                  disabled={isAnyPending}
                >
                  {!googlePending && (
                    <Google className="mr-2 size-5" aria-hidden="true" focusable="false" />
                  )}
                  {googlePending ? "Redirecting…" : "Google Account"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </m.div>
    </RewayLazyMotion>
  )
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading login interface…</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}

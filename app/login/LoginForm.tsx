"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { ViewIcon, ViewOffSlashIcon, SecurityWarningIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion, AnimatePresence } from "motion/react"
import { useSearchParams } from "next/navigation"
import { useActionState, useState, useEffect, Suspense, useMemo } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Google } from "@/components/google-logo"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include a lowercase letter.",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include an uppercase letter.",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must include a number.",
  })
  .refine((value) => /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(value), {
    message: "Password must include a symbol.",
  })

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation icon hover state
  const [isIconHovered, setIsIconHovered] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
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
  const [activeUrlError, setActiveUrlError] = useState<string | null>(urlError)

  // Track animation state to disable overflow-hidden once password field is fully animated
  const [pwdAnimDone, setPwdAnimDone] = useState(false)

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
    setShowPassword(false)
    setShowConfirmPassword(false)
    setIsIconHovered(false)
    setIsPasswordFocused(false)
    setShowSuccessMessage(false)
    setPwdAnimDone(false)
    const existingEmail = form.getValues("email") || ""
    form.reset({
      fullName: "",
      email: existingEmail,
      password: "",
      confirmPassword: "",
    })
    form.clearErrors()
  }, [mode, form])

  // Close popover on click outside (extremely useful for mobile tap-to-open)
  useEffect(() => {
    if (!isIconHovered) return
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-password-validation]")) {
        setIsIconHovered(false)
      }
    }
    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [isIconHovered])

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
          submitPendingText: "Signing in...",
        }
      case "signup":
        return {
          action: signUpAction,
          state: signUpState,
          pending: signUpPending,
          title: "Create an account",
          subtitle: "Get started with Reway to save and organize bookmarks",
          submitText: "Create Account",
          submitPendingText: "Creating account...",
        }
      case "magiclink":
        return {
          action: magicLinkAction,
          state: magicLinkState,
          pending: magicLinkPending,
          title: "Sign in with Magic Link",
          subtitle: "We'll send a secure passwordless login link to your inbox",
          submitText: "Send Magic Link",
          submitPendingText: "Sending link...",
        }
      case "forgotpassword":
        return {
          action: forgotPasswordAction,
          state: forgotPasswordState,
          pending: forgotPasswordPending,
          title: "Reset Password",
          subtitle: "Enter your email to receive a password reset link",
          submitText: "Send Reset Link",
          submitPendingText: "Sending link...",
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

  // Password strength checker using Red / Yellow / Green colors
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) {
      return {
        score: 0,
        text: "",
        color: "",
        textColor: "",
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecial: false,
        isLongEnough: false,
      }
    }

    let score = 0
    const hasLowercase = /[a-z]/.test(pwd)
    const hasUppercase = /[A-Z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(pwd)

    if (hasLowercase) score++
    if (hasUppercase) score++
    if (hasNumber) score++
    if (hasSpecial) score++

    const isLongEnough = pwd.length >= 8

    let text = "Weak"
    let color = "bg-red-500"
    let textColor = "text-red-500"

    if (score <= 2) {
      text = "Weak"
      color = "bg-red-500"
      textColor = "text-red-500"
    } else if (score === 3) {
      text = "Medium"
      color = "bg-yellow-500"
      textColor = "text-yellow-500"
    } else if (score === 4) {
      if (isLongEnough) {
        text = "Strong"
        color = "bg-green-500"
        textColor = "text-green-500"
      } else {
        text = "Medium (Needs 8+ characters)"
        color = "bg-yellow-500"
        textColor = "text-yellow-500"
      }
    }

    return {
      score,
      text,
      color,
      textColor,
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecial,
      isLongEnough,
    }
  }

  const strength = getPasswordStrength(password)

  // Real-time button disabling validation
  const isValidationPassing = strength.score === 4 && strength.isLongEnough

  // Validation icon color state
  const iconColorClass =
    password === ""
      ? "text-muted-foreground hover:text-foreground"
      : isValidationPassing
        ? "text-green-500"
        : "text-red-500"

  // Helper to determine the dot indicator color in the requirements popover
  const getDotColorClass = (isMet: boolean) => {
    if (password === "") return "bg-muted-foreground/30"
    return isMet ? "bg-green-500" : "bg-red-500"
  }

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

    void action(formData)
  })

  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
      suppressHydrationWarning
      className="space-y-6"
    >
      <div className="flex flex-col items-center text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
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
              <motion.div
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
              </motion.div>
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
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
                }
                onAnimationComplete={() => {
                  if (mode === "signin" || mode === "signup") {
                    setPwdAnimDone(true)
                  }
                }}
                className={`px-2 -mx-2 py-1 -my-1 space-y-1.5 relative z-30 ${pwdAnimDone || isIconHovered ? "overflow-visible" : "overflow-hidden"}`}
              >
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      data-disabled={isAnyPending}
                      className="gap-1.5"
                    >
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required={mode === "signin" || mode === "signup"}
                          disabled={isAnyPending}
                          className={`rounded-3xl transition-all duration-200 ${
                            mode === "signup" ? "pr-16" : "pr-10"
                          }`}
                          aria-invalid={fieldState.invalid}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={(event) => {
                            const nextTarget = event.relatedTarget as HTMLElement | null
                            if (!nextTarget?.closest("[data-password-validation]")) {
                              setIsPasswordFocused(false)
                              setIsIconHovered(false)
                            }
                          }}
                        />

                        {/* Password validation icon (signup mode only) */}
                        {mode === "signup" && (
                          <div
                            className="absolute inset-y-0 right-9 flex items-center"
                            data-password-validation
                          >
                            <button
                              type="button"
                              onMouseEnter={() => setIsIconHovered(true)}
                              onMouseLeave={() => setIsIconHovered(false)}
                              onFocus={() => {
                                setIsPasswordFocused(true)
                                setIsIconHovered(true)
                              }}
                              onBlur={() => {
                                setIsPasswordFocused(false)
                                setIsIconHovered(false)
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                setIsIconHovered((prev) => !prev)
                              }}
                              className={`focus:outline-none transition-colors cursor-pointer ${iconColorClass}`}
                              aria-label="Password requirements"
                              aria-expanded={isIconHovered}
                              aria-controls="password-requirements"
                            >
                              <HugeiconsIcon icon={SecurityWarningIcon} size={18} />
                            </button>

                            {/* Compact hover popover showing missing requirements with red dots */}
                            <AnimatePresence>
                              {isIconHovered && (password !== "" || isPasswordFocused) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{
                                    duration: 0.12,
                                    ease: "easeOut",
                                  }}
                                  id="password-requirements"
                                  className="absolute right-0 bottom-[calc(100%+8px)] z-[60] w-36 p-2 bg-card border border-border rounded-lg shadow-xl space-y-1 backdrop-blur-md"
                                >
                                  <div className="space-y-1 text-[10px] text-foreground">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`size-1.5 rounded-full ${getDotColorClass(strength.isLongEnough)}`}
                                      />
                                      <span>Min 8 characters</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`size-1.5 rounded-full ${getDotColorClass(strength.hasUppercase)}`}
                                      />
                                      <span>Uppercase letter</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`size-1.5 rounded-full ${getDotColorClass(strength.hasLowercase)}`}
                                      />
                                      <span>Lowercase letter</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`size-1.5 rounded-full ${getDotColorClass(strength.hasNumber)}`}
                                      />
                                      <span>Number</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`size-1.5 rounded-full ${getDotColorClass(strength.hasSpecial)}`}
                                      />
                                      <span>Special character</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          <HugeiconsIcon
                            icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                            size={18}
                            className="transition-transform duration-200 active:scale-95"
                          />
                        </button>
                      </div>

                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {mode === "signup" && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
                }
                className="overflow-hidden px-2 -mx-2 py-1 -my-1 space-y-1.5 relative z-20"
              >
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      data-disabled={isAnyPending}
                      className="gap-1.5"
                    >
                      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required={mode === "signup"}
                          disabled={isAnyPending}
                          className="rounded-3xl pr-10"
                          aria-invalid={fieldState.invalid}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          <HugeiconsIcon
                            icon={showConfirmPassword ? ViewOffSlashIcon : ViewIcon}
                            size={18}
                            className="transition-transform duration-200 active:scale-95"
                          />
                        </button>
                      </div>

                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </motion.div>
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
            <span className="flex-shrink mx-4 text-xs text-muted-foreground">Or continue with</span>
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
                {googlePending ? "Redirecting..." : "Google Account"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading login interface...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}

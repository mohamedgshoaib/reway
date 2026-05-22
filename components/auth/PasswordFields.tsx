"use client"

import { ViewIcon, ViewOffSlashIcon, SecurityWarningIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { useEffect, useState } from "react"
import { Control, FieldPath, FieldValues, useController } from "react-hook-form"
import { getPasswordStrength } from "@/lib/auth/password-validation"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type BasePasswordFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  disabled?: boolean
  label: string
  name: FieldPath<TFieldValues>
  placeholder: string
  required?: boolean
}

type PasswordFieldProps<TFieldValues extends FieldValues> = BasePasswordFieldProps<TFieldValues> & {
  showRequirements?: boolean
}

export function PasswordField<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  label,
  name,
  placeholder,
  required = false,
  showRequirements = false,
}: PasswordFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false)
  const [isIconHovered, setIsIconHovered] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const { field, fieldState } = useController({ control, name })
  const password = typeof field.value === "string" ? field.value : ""
  const strength = getPasswordStrength(password)
  const isValidationPassing = strength.score === 4 && strength.isLongEnough
  const iconColorClass =
    password === ""
      ? "text-muted-foreground hover:text-foreground"
      : isValidationPassing
        ? "text-green-500"
        : "text-red-500"

  useEffect(() => {
    if (!isIconHovered) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-password-validation]")) {
        setIsIconHovered(false)
      }
    }

    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [isIconHovered])

  const getDotColorClass = (isMet: boolean) => {
    if (password === "") return "bg-muted-foreground/30"
    return isMet ? "bg-green-500" : "bg-red-500"
  }

  return (
    <Field data-invalid={fieldState.invalid} data-disabled={disabled} className="gap-1.5">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <div className="relative">
        <Input
          {...field}
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`rounded-3xl transition-all duration-200 ${showRequirements ? "pr-16" : "pr-10"}`}
          aria-invalid={fieldState.invalid}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={(event) => {
            field.onBlur()
            const nextTarget = event.relatedTarget as HTMLElement | null
            if (!nextTarget?.closest("[data-password-validation]")) {
              setIsPasswordFocused(false)
              setIsIconHovered(false)
            }
          }}
        />

        {showRequirements && (
          <div className="absolute inset-y-0 right-9 flex items-center" data-password-validation>
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
              onClick={(event) => {
                event.preventDefault()
                setIsIconHovered((prev) => !prev)
              }}
              className={`focus:outline-none transition-colors cursor-pointer ${iconColorClass}`}
              aria-label="Password requirements"
              aria-expanded={isIconHovered}
              aria-controls={`${name}-requirements`}
            >
              <HugeiconsIcon icon={SecurityWarningIcon} size={18} />
            </button>

            <AnimatePresence>
              {isIconHovered && (password !== "" || isPasswordFocused) && (
                <m.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  id={`${name}-requirements`}
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
                </m.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          onMouseDown={(event) => event.preventDefault()}
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
  )
}

export function ConfirmPasswordField<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  label,
  name,
  placeholder,
  required = false,
}: BasePasswordFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false)
  const { field, fieldState } = useController({ control, name })

  return (
    <Field data-invalid={fieldState.invalid} data-disabled={disabled} className="gap-1.5">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <div className="relative">
        <Input
          {...field}
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="rounded-3xl pr-10"
          aria-invalid={fieldState.invalid}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
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
  )
}

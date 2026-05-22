import * as z from "zod"

export const passwordSchema = z
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

export const passwordMeetsRequirements = (password: string) => {
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(password)
  return password.length >= 8 && hasLowercase && hasUppercase && hasNumber && hasSpecial
}

export const getPasswordStrength = (password: string) => {
  if (!password) {
    return {
      score: 0,
      hasLowercase: false,
      hasUppercase: false,
      hasNumber: false,
      hasSpecial: false,
      isLongEnough: false,
    }
  }

  let score = 0
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/.test(password)

  if (hasLowercase) score++
  if (hasUppercase) score++
  if (hasNumber) score++
  if (hasSpecial) score++

  return {
    score,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecial,
    isLongEnough: password.length >= 8,
  }
}

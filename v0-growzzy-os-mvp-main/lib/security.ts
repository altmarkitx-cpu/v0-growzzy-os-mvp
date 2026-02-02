import crypto from "crypto"

// Rate limiting
const rateLimits = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const limit = rateLimits.get(key)

  if (!limit || now > limit.reset) {
    rateLimits.set(key, { count: 1, reset: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}

// CSRF token generation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").substring(0, 500)
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Validate URL
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

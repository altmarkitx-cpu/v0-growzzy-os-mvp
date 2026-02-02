export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+$$$$]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10
}

export function validatePlatform(platform: string): boolean {
  return ["meta", "google", "shopify", "linkedin"].includes(platform)
}

export function validateRequiredFields(data: Record<string, any>, fields: string[]): string[] {
  return fields.filter((field) => !data[field])
}

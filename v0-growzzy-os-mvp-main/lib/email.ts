interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  // In production, integrate with SendGrid, Resend, or similar
  console.log("[v0] Email sent:", options)
  return true
}

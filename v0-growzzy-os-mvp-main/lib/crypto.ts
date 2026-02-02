import crypto from "crypto"

const algorithm = "aes-256-cbc"
const encryptionKey = process.env.ENCRYPTION_KEY || "0".repeat(64)

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, "hex"), iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decrypt(text: string): string {
  const parts = text.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, "hex"), iv)
  let decrypted = decipher.update(parts[1], "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop")
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 })

  const clientId = process.env.SHOPIFY_API_KEY
  const scope = "read_products,read_orders"
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/shopify`

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`

  return NextResponse.redirect(authUrl)
}

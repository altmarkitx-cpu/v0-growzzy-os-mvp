import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { platform, credentials } = await req.json()

    let accountInfo

    switch (platform) {
      case "meta":
        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${credentials.adAccountId}?fields=name,account_status,currency&access_token=${credentials.accessToken}`,
        )

        if (!metaResponse.ok) {
          const error = await metaResponse.json()
          throw new Error(error.error?.message || "Invalid Meta credentials")
        }

        const metaData = await metaResponse.json()
        accountInfo = {
          name: metaData.name,
          status: metaData.account_status,
          currency: metaData.currency,
        }
        break

      case "google":
        // For Google, we'll validate the format (actual API test requires OAuth flow)
        if (!credentials.customerId.match(/^\d{3}-\d{3}-\d{4}$/)) {
          throw new Error("Invalid Google Customer ID format (should be XXX-XXX-XXXX)")
        }
        accountInfo = {
          name: `Google Ads - ${credentials.customerId}`,
          customerId: credentials.customerId,
        }
        break

      case "shopify":
        const shopifyResponse = await fetch(`https://${credentials.shopDomain}/admin/api/2024-01/shop.json`, {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
          },
        })

        if (!shopifyResponse.ok) {
          throw new Error("Invalid Shopify credentials or domain")
        }

        const shopifyData = await shopifyResponse.json()
        accountInfo = {
          name: shopifyData.shop.name,
          domain: shopifyData.shop.domain,
          email: shopifyData.shop.email,
        }
        break

      case "linkedin":
        const linkedinResponse = await fetch(`https://api.linkedin.com/rest/adAccounts/${credentials.accountId}`, {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "LinkedIn-Version": "202401",
          },
        })

        if (!linkedinResponse.ok) {
          throw new Error("Invalid LinkedIn credentials")
        }

        const linkedinData = await linkedinResponse.json()
        accountInfo = {
          name: linkedinData.name || `LinkedIn - ${credentials.accountId}`,
          accountId: credentials.accountId,
        }
        break

      default:
        throw new Error("Unsupported platform")
    }

    return NextResponse.json({
      success: true,
      accountInfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 400 },
    )
  }
}

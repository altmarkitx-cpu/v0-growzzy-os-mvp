import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdsAccountGate } from "@/components/AdsAccountGate"
import { OnboardingGate } from "@/components/onboarding-gate"

export const metadata = {
  title: `Dashboard | ${process.env.NEXT_PUBLIC_PRODUCT_NAME || "Growzzy OS"}`,
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <AdsAccountGate>
        <OnboardingGate>
          {children}
        </OnboardingGate>
      </AdsAccountGate>
    </ProtectedRoute>
  )
}

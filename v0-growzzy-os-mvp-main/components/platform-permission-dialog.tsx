"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface PlatformPermissionDialogProps {
  platform: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PlatformPermissionDialog({ platform, open, onOpenChange, onConfirm }: PlatformPermissionDialogProps) {
  const [agreed, setAgreed] = useState(false)

  const permissions = {
    meta: ["Access to ad accounts", "View campaign data", "Manage campaigns", "Read analytics"],
    google: ["Access to Google Ads", "View campaigns and performance", "Manage ad settings", "Read reports"],
    linkedin: ["Access to LinkedIn ads", "View campaigns", "Manage ad accounts", "Read analytics"],
    shopify: ["Access to store data", "View products and orders", "Manage inventory", "Read sales data"],
  }

  const platformPermissions = permissions[platform as keyof typeof permissions] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to {platform.charAt(0).toUpperCase() + platform.slice(1)}</DialogTitle>
          <DialogDescription>Grant permissions for GrowzzyOS to access your data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-3">Permissions Required:</h4>
            <ul className="space-y-2">
              {platformPermissions.map((permission) => (
                <li key={permission} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lg">✓</span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
            <Label htmlFor="agree" className="text-sm cursor-pointer">
              I agree to grant these permissions
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={!agreed}>
              Continue to {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

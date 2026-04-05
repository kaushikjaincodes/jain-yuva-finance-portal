"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsChangingPassword(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Password changed successfully")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your admin password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </Field>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Spinner className="mr-2" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interest Rates</CardTitle>
            <CardDescription>
              Current interest rate configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Normal Loan Interest</p>
                  <p className="text-sm text-muted-foreground">Monthly simple interest rate</p>
                </div>
                <span className="text-lg font-bold">0.25%</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Temporary Loan Interest</p>
                  <p className="text-sm text-muted-foreground">Monthly simple interest rate</p>
                </div>
                <span className="text-lg font-bold">1.00%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penalty Structure</CardTitle>
            <CardDescription>
              Current penalty configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium mb-2">Contribution Missed</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Escalating penalty per consecutive month missed
                </p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-medium">1st</div>
                    <div className="text-muted-foreground">Rs 10</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-medium">2nd</div>
                    <div className="text-muted-foreground">Rs 20</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-medium">3rd</div>
                    <div className="text-muted-foreground">Rs 40</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-medium">4th</div>
                    <div className="text-muted-foreground">Rs 80</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Loan Installment Missed</p>
                  <p className="text-sm text-muted-foreground">Flat penalty per missed installment</p>
                </div>
                <span className="text-lg font-bold">Rs 500</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

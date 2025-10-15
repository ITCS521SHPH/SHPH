"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { vhvApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { getCurrentUserFromStorage, clearCurrentUser } from "@/lib/auth"

const NO_DISTRICT_VALUE = "__no_district__"

export function VHVProfileSettings() {
  const router = useRouter()
  const [currentUser] = useState(() => getCurrentUserFromStorage())
  const [profileForm, setProfileForm] = useState({
    phone: "",
    district: "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getVHVProfile = useCallback(async () => {
    if (!currentUser?.id) return null
    return vhvApi.getProfile(currentUser.id)
  }, [currentUser?.id])

  const {
    data: vhvProfile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApiData(getVHVProfile, [currentUser?.id])

  useEffect(() => {
    if (profileLoading) return
    setStatusMessage(null)
    setProfileForm({
      phone: vhvProfile?.phone ?? "",
      district: vhvProfile?.district ?? "",
    })
  }, [vhvProfile?.phone, vhvProfile?.district, profileLoading])

  const handleFieldChange = (field: "phone" | "district", value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setStatusMessage(null)
  }

  const profileHasChanges = useMemo(() => {
    if (profileLoading) return false
    const originalPhone = (vhvProfile?.phone ?? "").trim()
    const originalDistrict = vhvProfile?.district ?? ""
    const currentPhone = profileForm.phone.trim()
    const currentDistrict = profileForm.district

    return originalPhone !== currentPhone || originalDistrict !== currentDistrict
  }, [vhvProfile?.phone, vhvProfile?.district, profileForm.phone, profileForm.district, profileLoading])

  const handleReset = () => {
    setProfileForm({
      phone: vhvProfile?.phone ?? "",
      district: vhvProfile?.district ?? "",
    })
    setStatusMessage(null)
  }

  const handleSave = async () => {
    if (!currentUser?.id) return

    try {
      setProfileSaving(true)
      await vhvApi.updateProfile(currentUser.id, {
        phone: profileForm.phone.trim() !== "" ? profileForm.phone.trim() : null,
        district: profileForm.district !== "" ? profileForm.district : null,
      })
      setStatusMessage({ type: "success", text: "Profile updated successfully." })
      setProfileForm((prev) => ({
        phone: prev.phone.trim(),
        district: prev.district,
      }))
      refetchProfile()
    } catch (error) {
      console.error("Failed to update VHV profile:", error)
      const message = error instanceof Error ? error.message : "Failed to update profile"
      setStatusMessage({ type: "error", text: message })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const coverageSummary = profileLoading
    ? "Loading coverage details..."
    : profileError
      ? "Coverage details unavailable."
      : vhvProfile?.district
        ? `Primary district: ${vhvProfile.district}`
        : "No district selected yet."

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">My Profile & Coverage</h1>
            <p className="text-muted-foreground">Manage your contact details and service area.</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{coverageSummary}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/vhv/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Coverage Settings</CardTitle>
            <CardDescription>
              Select the Bangkok district you are responsible for. Your assigned patients and tasks on the dashboard
              will follow this selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileError ? (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>{profileError}</span>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vhvDistrict">Assigned District</Label>
                    <Select
                      value={profileForm.district ? profileForm.district : NO_DISTRICT_VALUE}
                      onValueChange={(value) =>
                        handleFieldChange("district", value === NO_DISTRICT_VALUE ? "" : value)
                      }
                      disabled={profileLoading || profileSaving}
                    >
                      <SelectTrigger id="vhvDistrict" className="w-full">
                        <SelectValue placeholder="Select Bangkok district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 md:max-h-80 overflow-y-auto">
                        <SelectItem value={NO_DISTRICT_VALUE}>No district assigned</SelectItem>
                        {BANGKOK_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the district where you actively support patients.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vhvPhone">Contact Phone (optional)</Label>
                    <Input
                      id="vhvPhone"
                      value={profileForm.phone}
                      onChange={(event) => handleFieldChange("phone", event.target.value)}
                      placeholder="Enter phone number"
                      disabled={profileLoading || profileSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide a number so patients and staff can reach you quickly.
                    </p>
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      statusMessage.type === "error" ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {statusMessage.type === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={!profileHasChanges || profileSaving || profileLoading}
                  >
                    Reset
                  </Button>
                  <Button onClick={handleSave} disabled={!profileHasChanges || profileSaving || profileLoading}>
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need a reminder?</CardTitle>
            <CardDescription>
              Your dashboard filters assigned patients and tasks by the district selected above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Update your district whenever your area of responsibility changes.
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Keep your contact number current so patients and coordinators can reach you.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

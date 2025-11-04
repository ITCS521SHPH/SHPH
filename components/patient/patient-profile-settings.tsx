"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, CheckCircle, Home, MapPin, Phone } from "lucide-react"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { patientsApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { clearCurrentUser, getCurrentUserFromStorage } from "@/lib/auth"

const NO_DISTRICT_VALUE = "__no_district__"

type PatientProfileForm = {
  phone: string
  district: string
  address: string
}

export function PatientProfileSettings() {
  const router = useRouter()
  const [currentUser] = useState(() => getCurrentUserFromStorage())
  const [profileForm, setProfileForm] = useState<PatientProfileForm>({
    phone: "",
    district: "",
    address: "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getPatientProfile = useCallback(async () => {
    if (!currentUser?.id) return null
    return patientsApi.getProfile(currentUser.id)
  }, [currentUser?.id])

  const {
    data: patientProfile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApiData(getPatientProfile, [currentUser?.id])

  useEffect(() => {
    if (profileLoading) return
    setStatusMessage(null)
    setProfileForm({
      phone: patientProfile?.phone ?? "",
      district: patientProfile?.district ?? "",
      address: patientProfile?.address ?? "",
    })
  }, [patientProfile?.phone, patientProfile?.district, patientProfile?.address, profileLoading])

  const handleFieldChange = (field: keyof PatientProfileForm, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setStatusMessage(null)
  }

  const profileHasChanges = useMemo(() => {
    if (profileLoading) return false
    const originalPhone = (patientProfile?.phone ?? "").trim()
    const originalDistrict = patientProfile?.district ?? ""
    const originalAddress = patientProfile?.address ?? ""

    const currentPhone = profileForm.phone.trim()
    const currentDistrict = profileForm.district
    const currentAddress = profileForm.address.trim()

    return (
      originalPhone !== currentPhone ||
      originalDistrict !== currentDistrict ||
      originalAddress !== currentAddress
    )
  }, [patientProfile?.phone, patientProfile?.district, patientProfile?.address, profileForm, profileLoading])

  const handleReset = () => {
    setProfileForm({
      phone: patientProfile?.phone ?? "",
      district: patientProfile?.district ?? "",
      address: patientProfile?.address ?? "",
    })
    setStatusMessage(null)
  }

  const handleSave = async () => {
    if (!currentUser?.id) return

    try {
      setProfileSaving(true)
      await patientsApi.updateProfile(currentUser.id, {
        phone: profileForm.phone.trim() !== "" ? profileForm.phone.trim() : null,
        district: profileForm.district !== "" ? profileForm.district : null,
        address: profileForm.address.trim() !== "" ? profileForm.address.trim() : null,
      })
      setStatusMessage({ type: "success", text: "Profile updated successfully." })
      setProfileForm((prev) => ({
        phone: prev.phone.trim(),
        district: prev.district,
        address: prev.address.trim(),
      }))
      refetchProfile()
    } catch (error) {
      console.error("Failed to update patient profile:", error)
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

  const locationSummary = profileLoading
    ? "Loading location details..."
    : profileError
      ? "Location details unavailable."
      : patientProfile?.district
        ? `Current district: ${patientProfile.district}`
        : "No district selected yet."

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-bold">My Profile & Location</h1>
              <p className="text-muted-foreground">Keep your contact information and current location up to date.</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-2">{locationSummary}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="ghost" className="w-full sm:w-auto justify-center" asChild>
                <Link href="/patient/dashboard" className="flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-center"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location & Contact</CardTitle>
            <CardDescription>
              Choose the Bangkok district where you are currently staying and provide a reliable contact number.
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
                    <Label htmlFor="patientDistrict">Current District</Label>
                    <Select
                      value={profileForm.district ? profileForm.district : NO_DISTRICT_VALUE}
                      onValueChange={(value) =>
                        handleFieldChange("district", value === NO_DISTRICT_VALUE ? "" : value)
                      }
                      disabled={profileLoading || profileSaving}
                    >
                      <SelectTrigger id="patientDistrict" className="w-full">
                        <SelectValue placeholder="Select Bangkok district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 md:max-h-80 overflow-y-auto">
                        <SelectItem value={NO_DISTRICT_VALUE}>No district selected</SelectItem>
                        {BANGKOK_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This helps VHVs plan visits and ensures alerts reach the right team.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Contact Phone (optional)</Label>
                    <Input
                      id="patientPhone"
                      value={profileForm.phone}
                      onChange={(event) => handleFieldChange("phone", event.target.value)}
                      placeholder="Enter phone number"
                      disabled={profileLoading || profileSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide a number so caregivers and coordinators can reach you quickly.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientAddress">Current Address (optional)</Label>
                  <Textarea
                    id="patientAddress"
                    value={profileForm.address}
                    onChange={(event) => handleFieldChange("address", event.target.value)}
                    placeholder="Building, street, or additional directions"
                    rows={3}
                    disabled={profileLoading || profileSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add more details to help VHVs or medical staff find you if a visit is scheduled.
                  </p>
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
            <CardTitle>Why keep this updated?</CardTitle>
            <CardDescription>Accurate information helps your care team respond quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              VHVs use your district to plan home visits and outreach activities.
            </p>
            <p className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Provide an address if you have moved or are staying somewhere temporarily.
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Keeping your phone number current ensures you never miss an important update.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

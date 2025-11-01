"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { PatientProfileSettings } from "@/components/patient/patient-profile-settings"

export default function PatientProfilePage() {
  return (
    <RouteGuard>
      <PatientProfileSettings />
    </RouteGuard>
  )
}

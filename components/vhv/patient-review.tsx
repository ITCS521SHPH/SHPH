"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, FileText, Activity, User, MapPin, Phone, ArrowLeft } from "lucide-react"

interface PatientReviewProps {
  patient: {
    id: number
    name: string
    age: number
    address: string
    phone: string
    condition: string
    dataCollection: {
      patientInfo: { completed: boolean; items: string[] }
      vitalSigns: { completed: boolean; items: string[] }
      symptoms: { completed: boolean; items: string[] }
      medicalHistory: { completed: boolean; items: string[] }
    }
  }
  onBack: () => void
  onConfirm: () => void
}

export function PatientReview({ patient, onBack, onConfirm }: PatientReviewProps) {
  const mockCollectedData = {
    patientInfo: {
      name: patient.name,
      age: patient.age,
      gender: "Female",
      contact: patient.phone,
    },
    vitalSigns: {
      temperature: "37.2°C",
      bloodPressure: "120/80 mmHg",
      pulse: "72 bpm",
      weight: "65 kg",
    },
    symptoms: {
      primaryComplaint: "Persistent cough and mild fever",
      duration: "3 days",
      severity: "Moderate",
      associatedSymptoms: "Fatigue, slight headache",
    },
    medicalHistory: {
      previousConditions: patient.condition,
      currentMedications: "Lisinopril 10mg daily",
      allergies: "No known allergies",
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Data Review & Validation</h1>
              <p className="text-muted-foreground">Review collected data before submission</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Patient Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Patient Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span> {patient.name}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span> {patient.age} years
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{patient.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collected Data Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Patient Information
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{mockCollectedData.patientInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Age:</span>
                    <span className="text-sm">{mockCollectedData.patientInfo.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="text-sm">{mockCollectedData.patientInfo.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Contact:</span>
                    <span className="text-sm">{mockCollectedData.patientInfo.contact}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Vital Signs
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Temperature:</span>
                    <span className="text-sm">{mockCollectedData.vitalSigns.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Blood Pressure:</span>
                    <span className="text-sm">{mockCollectedData.vitalSigns.bloodPressure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Pulse:</span>
                    <span className="text-sm">{mockCollectedData.vitalSigns.pulse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Weight:</span>
                    <span className="text-sm">{mockCollectedData.vitalSigns.weight}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Symptoms
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Primary Complaint:</span>
                    <p className="text-sm text-muted-foreground mt-1">{mockCollectedData.symptoms.primaryComplaint}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm">{mockCollectedData.symptoms.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Severity:</span>
                    <span className="text-sm">{mockCollectedData.symptoms.severity}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Associated Symptoms:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mockCollectedData.symptoms.associatedSymptoms}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Medical History
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Previous Conditions:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mockCollectedData.medicalHistory.previousConditions}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Current Medications:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mockCollectedData.medicalHistory.currentMedications}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Allergies:</span>
                    <p className="text-sm text-muted-foreground mt-1">{mockCollectedData.medicalHistory.allergies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Ready for Submission
              </CardTitle>
              <CardDescription>
                All required data has been collected and is ready for doctor validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Data Collection Complete</span>
                </div>
                <p className="text-sm text-green-700">
                  All required sections have been completed. The data will be submitted to Dr. Michael Chen for
                  validation and diagnosis.
                </p>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onBack}>
                  Back to Edit
                </Button>
                <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Submit to Doctor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

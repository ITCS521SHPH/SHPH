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
  formData?: any // Add formData prop
  onBack: () => void
  onConfirm: () => void
}

export function PatientReview({ patient, formData, onBack, onConfirm }: PatientReviewProps) {
  // Use real form data if available, otherwise fall back to mock data
  const collectedData = formData ? {
    patientInfo: {
      name: formData.patientFullName || patient.name,
      hospitalNumber: formData.hospitalNumber || "Not provided",
      gender: "Not specified", // This field is not in our form
      contact: patient.phone,
    },
    vitalSigns: {
      oxygenSaturation: formData.oxygenSaturation ? `${formData.oxygenSaturation}%` : "Not measured",
      bloodPressure: formData.bloodPressureSystolic && formData.bloodPressureDiastolic 
        ? `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic} mmHg` 
        : "Not measured",
      heartRate: formData.heartRate ? `${formData.heartRate} bpm` : "Not measured",
      bloodGlucose: formData.bloodGlucose ? `${formData.bloodGlucose} mg/dL` : "Not measured",
    },
    physicalFunction: {
      dyspneaScore: formData.dyspneaScore || "Not assessed",
      balanceScore: formData.balanceScore || "Not assessed",
      ipaqScore: formData.ipaqScore || "Not assessed",
      sitToStandReps: formData.sitToStandReps || "Not tested",
      sixMinuteWalk: formData.sixMinuteWalk || "Not tested",
      sppbScore: formData.sppbScore || "Not assessed",
      gripStrengthRight: formData.gripStrengthRight || "Not measured",
      gripStrengthLeft: formData.gripStrengthLeft || "Not measured",
    },
    mentalCognitive: {
      mocaScore: formData.mocaScore || "Not assessed",
      fatigueSeverityScale: formData.fatigueSeverityScale || "Not assessed",
      facitFatigueScale: formData.facitFatigueScale || "Not assessed",
      chalderFatigueScale: formData.chalderFatigueScale || "Not assessed",
      gad7Score: formData.gad7Score || "Not assessed",
      hadsAnxietyScore: formData.hadsAnxietyScore || "Not assessed",
      hadsDepressionScore: formData.hadsDepressionScore || "Not assessed",
      beckScore: formData.beckScore || "Not assessed",
      iesrScore: formData.iesrScore || "Not assessed",
    },
    vhvNotes: {
      patientConcerns: formData.patientConcerns || "No concerns noted",
      vhvObservations: formData.vhvObservations || "No observations noted",
    }
  } : {
    // Fallback mock data when no form data is available
    patientInfo: {
      name: patient.name,
      hospitalNumber: "No data available",
      gender: "Not specified",
      contact: patient.phone,
    },
    vitalSigns: {
      oxygenSaturation: "No data collected",
      bloodPressure: "No data collected", 
      heartRate: "No data collected",
      bloodGlucose: "No data collected",
    },
    physicalFunction: {
      dyspneaScore: "No data collected",
      balanceScore: "No data collected",
      ipaqScore: "No data collected",
      sitToStandReps: "No data collected",
      sixMinuteWalk: "No data collected",
      sppbScore: "No data collected",
      gripStrengthRight: "No data collected",
      gripStrengthLeft: "No data collected",
    },
    mentalCognitive: {
      mocaScore: "No data collected",
      fatigueSeverityScale: "No data collected",
      facitFatigueScale: "No data collected",
      chalderFatigueScale: "No data collected",
      gad7Score: "No data collected",
      hadsAnxietyScore: "No data collected",
      hadsDepressionScore: "No data collected",
      beckScore: "No data collected",
      iesrScore: "No data collected",
    },
    vhvNotes: {
      patientConcerns: "No concerns noted",
      vhvObservations: "No observations noted",
    }
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
                    <span className="text-sm">{collectedData.patientInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Hospital Number:</span>
                    <span className="text-sm">{collectedData.patientInfo.hospitalNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="text-sm">{collectedData.patientInfo.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Contact:</span>
                    <span className="text-sm">{collectedData.patientInfo.contact}</span>
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
                    <span className="text-sm font-medium">Oxygen Saturation:</span>
                    <span className="text-sm">{collectedData.vitalSigns.oxygenSaturation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Blood Pressure:</span>
                    <span className="text-sm">{collectedData.vitalSigns.bloodPressure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Heart Rate:</span>
                    <span className="text-sm">{collectedData.vitalSigns.heartRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Blood Glucose:</span>
                    <span className="text-sm">{collectedData.vitalSigns.bloodGlucose}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Function & Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Physical Function & Performance
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
                    <span className="text-sm font-medium">Dyspnea Score:</span>
                    <span className="text-sm">{collectedData.physicalFunction.dyspneaScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Balance Score:</span>
                    <span className="text-sm">{collectedData.physicalFunction.balanceScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">IPAQ Score:</span>
                    <span className="text-sm">{collectedData.physicalFunction.ipaqScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sit-to-Stand Reps:</span>
                    <span className="text-sm">{collectedData.physicalFunction.sitToStandReps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">6-Minute Walk:</span>
                    <span className="text-sm">{collectedData.physicalFunction.sixMinuteWalk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">SPPB Score:</span>
                    <span className="text-sm">{collectedData.physicalFunction.sppbScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Grip Strength (Right):</span>
                    <span className="text-sm">{collectedData.physicalFunction.gripStrengthRight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Grip Strength (Left):</span>
                    <span className="text-sm">{collectedData.physicalFunction.gripStrengthLeft}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mental, Cognitive & Fatigue Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mental, Cognitive & Fatigue Assessment
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
                    <span className="text-sm font-medium">MoCA Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.mocaScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fatigue Severity Scale:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.fatigueSeverityScale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">FACIT Fatigue Scale:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.facitFatigueScale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Chalder Fatigue Scale:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.chalderFatigueScale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">GAD-7 Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.gad7Score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">HADS Anxiety Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.hadsAnxietyScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">HADS Depression Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.hadsDepressionScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Beck Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.beckScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">IES-R Score:</span>
                    <span className="text-sm">{collectedData.mentalCognitive.iesrScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VHV Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    VHV Notes & Observations
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
                    <span className="text-sm font-medium">Patient Concerns:</span>
                    <p className="text-sm text-muted-foreground mt-1">{collectedData.vhvNotes.patientConcerns}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">VHV Observations:</span>
                    <p className="text-sm text-muted-foreground mt-1">{collectedData.vhvNotes.vhvObservations}</p>
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

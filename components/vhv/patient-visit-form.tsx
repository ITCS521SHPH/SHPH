"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, User, Activity, Stethoscope, FileText } from "lucide-react"
import { intakesApi, patientsApi } from "@/lib/api-client"
import { ChronicCondition } from "@/lib/types"

const formSteps = [
  { id: "patient-info", title: "Patient Information", icon: User },
  { id: "vital-signs", title: "Vital Signs", icon: Activity },
  { id: "symptoms", title: "Symptoms & Complaints", icon: Stethoscope },
  { id: "medical-history", title: "Medical History", icon: FileText },
]

const commonSymptoms = [
  "Fever",
  "Cough",
  "Headache",
  "Nausea",
  "Fatigue",
  "Dizziness",
  "Chest Pain",
  "Shortness of Breath",
  "Abdominal Pain",
  "Joint Pain",
]

interface FormData {
  // Patient Info
  patientName: string
  age: string
  gender: string
  contact: string
  address: string

  // Vital Signs
  temperature: string
  bloodPressureSystolic: string
  bloodPressureDiastolic: string
  pulse: string
  weight: string
  height: string

  // Symptoms
  primaryComplaint: string
  symptomDuration: string
  symptomSeverity: string
  selectedSymptoms: string[]
  additionalSymptoms: string

  // Medical History
  previousConditions: string
  currentMedications: string
  allergies: string
  familyHistory: string
}

export function PatientVisitForm({ onBack }: { onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    patientName: "",
    age: "",
    gender: "",
    contact: "",
    address: "",
    temperature: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    pulse: "",
    weight: "",
    height: "",
    primaryComplaint: "",
    symptomDuration: "",
    symptomSeverity: "",
    selectedSymptoms: [],
    additionalSymptoms: "",
    previousConditions: "",
    currentMedications: "",
    allergies: "",
    familyHistory: "",
  })

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Patient Info
        return formData.patientName && formData.age && formData.gender
      case 1: // Vital Signs
        return formData.temperature && formData.bloodPressureSystolic && formData.pulse
      case 2: // Symptoms
        return formData.primaryComplaint && formData.symptomDuration
      case 3: // Medical History
        return true // Optional step
      default:
        return false
    }
  }

  const getStepCompleteness = () => {
    const totalFields = Object.keys(formData).length
    const filledFields = Object.values(formData).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value.trim() !== "",
    ).length
    return Math.round((filledFields / totalFields) * 100)
  }

  const handleSymptomToggle = (symptom: string) => {
    const current = formData.selectedSymptoms
    const updated = current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom]
    updateFormData("selectedSymptoms", updated)
  }

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // First, create or find the patient
      const patientData = {
        firstName: formData.patientName.split(' ')[0] || '',
        lastName: formData.patientName.split(' ').slice(1).join(' ') || '',
        dob: new Date(Date.now() - parseInt(formData.age) * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Calculate DOB from age
        phone: formData.contact,
        address: formData.address,
      };

      // Create patient if needed (this would ideally check if exists first)
      let patient;
      try {
        patient = await patientsApi.create(patientData);
      } catch (error) {
        // If patient already exists, we'll need to handle this better
        console.error('Patient creation failed:', error);
        throw new Error('Failed to create or find patient');
      }

      // Create intake draft
      const intake = await intakesApi.create({ patientId: patient.id });

      // Prepare intake payload according to API schema
      const intakePayload = {
        visitMeta: {
          visitDateTime: new Date().toISOString(),
          vhvId: '', // This will be set by the API from the authenticated user
          locationText: formData.address || 'Village Health Center'
        },
        patientBasics: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dob: patientData.dob,
          contactPhone: patientData.phone
        },
        symptoms: {
          chiefComplaint: formData.primaryComplaint || 'General health check',
          checklist: Array(10).fill(false).map((_, i) => formData.selectedSymptoms.includes(i.toString())),
          onsetDays: parseInt(formData.symptomDuration) || 0
        },
        vitals: {
          temp: parseFloat(formData.temperature) || undefined,
          systolic: parseFloat(formData.bloodPressureSystolic) || undefined,
          diastolic: parseFloat(formData.bloodPressureDiastolic) || undefined,
          hr: parseFloat(formData.pulse) || undefined
        },
        chronicConditions: {
          list: formData.previousConditions ?
            [{ condition: 'OTHER' as ChronicCondition, freeText: formData.previousConditions }] :
            []
        },
        riskFlags: {
          isAge60Plus: parseInt(formData.age) >= 60,
          isPregnant: formData.gender === 'female', // Simplified for demo
          hasChronic: !!formData.previousConditions
        },
        consent: {
          consentGiven: true // Assume consent is given for submitting the form
        }
      };

      // Update intake with payload
      await intakesApi.update(intake.id, intakePayload);

      // Submit for review
      await intakesApi.submit(intake.id);

      alert("Patient visit form submitted successfully and sent for doctor review!");
      onBack();
    } catch (error) {
      console.error('Failed to submit patient visit form:', error);
      alert("Failed to submit form. Please check your data and try again.");
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Patient Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => updateFormData("patientName", e.target.value)}
                  placeholder="Enter patient's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData("age", e.target.value)}
                  placeholder="Age in years"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => updateFormData("contact", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Patient's address"
                rows={2}
              />
            </div>
          </div>
        )

      case 1: // Vital Signs
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C) *</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateFormData("temperature", e.target.value)}
                  placeholder="e.g., 37.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse (bpm) *</Label>
                <Input
                  id="pulse"
                  type="number"
                  value={formData.pulse}
                  onChange={(e) => updateFormData("pulse", e.target.value)}
                  placeholder="e.g., 80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blood Pressure (mmHg) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => updateFormData("bloodPressureSystolic", e.target.value)}
                  placeholder="Systolic (e.g., 120)"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => updateFormData("bloodPressureDiastolic", e.target.value)}
                  placeholder="Diastolic (e.g., 80)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => updateFormData("weight", e.target.value)}
                  placeholder="e.g., 65.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateFormData("height", e.target.value)}
                  placeholder="e.g., 170"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Symptoms
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryComplaint">Primary Complaint *</Label>
              <Textarea
                id="primaryComplaint"
                value={formData.primaryComplaint}
                onChange={(e) => updateFormData("primaryComplaint", e.target.value)}
                placeholder="Describe the main reason for the visit in patient's own words"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symptomDuration">Duration *</Label>
                <Select
                  value={formData.symptomDuration}
                  onValueChange={(value) => updateFormData("symptomDuration", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How long?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-day">Less than a day</SelectItem>
                    <SelectItem value="1-3-days">1-3 days</SelectItem>
                    <SelectItem value="4-7-days">4-7 days</SelectItem>
                    <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                    <SelectItem value="more-than-2-weeks">More than 2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptomSeverity">Severity</Label>
                <Select
                  value={formData.symptomSeverity}
                  onValueChange={(value) => updateFormData("symptomSeverity", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Associated Symptoms</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={formData.selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalSymptoms">Additional Symptoms</Label>
              <Textarea
                id="additionalSymptoms"
                value={formData.additionalSymptoms}
                onChange={(e) => updateFormData("additionalSymptoms", e.target.value)}
                placeholder="Any other symptoms not listed above"
                rows={2}
              />
            </div>
          </div>
        )

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="previousConditions">Previous Medical Conditions</Label>
              <Textarea
                id="previousConditions"
                value={formData.previousConditions}
                onChange={(e) => updateFormData("previousConditions", e.target.value)}
                placeholder="Any known medical conditions, surgeries, or hospitalizations"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => updateFormData("currentMedications", e.target.value)}
                placeholder="List all medications currently being taken"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => updateFormData("allergies", e.target.value)}
                placeholder="Food, drug, or environmental allergies"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyHistory">Family Medical History</Label>
              <Textarea
                id="familyHistory"
                value={formData.familyHistory}
                onChange={(e) => updateFormData("familyHistory", e.target.value)}
                placeholder="Relevant family medical history"
                rows={2}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Patient Visit</h1>
              <p className="text-muted-foreground">
                Step {currentStep + 1} of {formSteps.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress and Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Form Completion</h2>
              <Badge variant="outline">{getStepCompleteness()}% Complete</Badge>
            </div>
            <Progress value={getStepCompleteness()} className="mb-6" />

            <div className="flex items-center justify-between">
              {formSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                            ? "border-primary text-primary"
                            : "border-muted text-muted-foreground"
                        }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    {index < formSteps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between mt-2">
              {formSteps.map((step, index) => (
                <div key={step.id} className="text-center" style={{ width: "10rem" }}>
                  <p
                    className={`text-xs ${index === currentStep ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                  >
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(formSteps[currentStep].icon, { className: "h-5 w-5" })}
                {formSteps[currentStep].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 0 && "Enter basic patient information"}
                {currentStep === 1 && "Record vital signs and measurements"}
                {currentStep === 2 && "Document symptoms and complaints"}
                {currentStep === 3 && "Collect medical history (optional)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}

              {!validateCurrentStep() && currentStep < 3 && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-orange-700">Please fill in all required fields marked with *</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < formSteps.length - 1 ? (
              <Button onClick={handleNext} disabled={!validateCurrentStep()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Visit
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

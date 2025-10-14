"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, Save, User, Heart, Phone, MapPin, AlertTriangle } from "lucide-react"
import type { Patient } from "@/lib/types"

interface PatientRegistrationFormProps {
  onSubmit: (patient: Omit<Patient, "id">) => void
  onCancel: () => void
  initialData?: Patient
}

export function PatientRegistrationForm({ onSubmit, onCancel, initialData }: PatientRegistrationFormProps) {
  const [formData, setFormData] = useState<Omit<Patient, "id">>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    dateOfBirth: initialData?.dateOfBirth || "",
    gender: initialData?.gender || "male",
    phoneNumber: initialData?.phoneNumber || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    emergencyContact: initialData?.emergencyContact || {
      name: "",
      relationship: "",
      phoneNumber: "",
    },
    bloodType: initialData?.bloodType || "",
    allergies: initialData?.allergies || [],
    chronicConditions: initialData?.chronicConditions || [],
    currentMedications: initialData?.currentMedications || [],
    patientId: initialData?.patientId || `PAT-${Date.now().toString().slice(-6)}`,
    registrationDate: initialData?.registrationDate || new Date().toISOString().split("T")[0],
    riskLevel: initialData?.riskLevel || "low",
    priority: initialData?.priority || false,
    district: initialData?.district || "",
    village: initialData?.village || "",
    householdId: initialData?.householdId || "",
  })

  const [newAllergy, setNewAllergy] = useState("")
  const [newCondition, setNewCondition] = useState("")
  const [newMedication, setNewMedication] = useState("")
  const [errors, setErrors] = useState<string[]>([])

  const addItem = (field: "allergies" | "chronicConditions" | "currentMedications", value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }))
      if (field === "allergies") setNewAllergy("")
      if (field === "chronicConditions") setNewCondition("")
      if (field === "currentMedications") setNewMedication("")
    }
  }

  const removeItem = (field: "allergies" | "chronicConditions" | "currentMedications", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.firstName.trim()) newErrors.push("First name is required")
    if (!formData.lastName.trim()) newErrors.push("Last name is required")
    if (!formData.dateOfBirth) newErrors.push("Date of birth is required")
    if (!formData.phoneNumber.trim()) newErrors.push("Phone number is required")
    if (!formData.address.trim()) newErrors.push("Address is required")
    if (!formData.emergencyContact.name.trim()) newErrors.push("Emergency contact name is required")
    if (!formData.emergencyContact.phoneNumber.trim()) newErrors.push("Emergency contact phone is required")

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {initialData ? "Edit Patient" : "Register New Patient"}
          </CardTitle>
          <CardDescription>
            {initialData ? "Update patient information" : "Enter patient details to create a new medical record"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "male" | "female" | "other") =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1-555-0123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="patient@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                      }))
                    }
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, relationship: e.target.value },
                      }))
                    }
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone Number *</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyContact.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phoneNumber: e.target.value },
                      }))
                    }
                    placeholder="+1-555-0124"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Medical Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <h3 className="text-lg font-semibold">Medical Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, bloodType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setFormData((prev) => ({ ...prev, riskLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label>Allergies</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add allergy"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("allergies", newAllergy))}
                  />
                  <Button type="button" onClick={() => addItem("allergies", newAllergy)} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {allergy}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("allergies", index)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Add chronic condition"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addItem("chronicConditions", newCondition))
                    }
                  />
                  <Button type="button" onClick={() => addItem("chronicConditions", newCondition)} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.chronicConditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {condition}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("chronicConditions", index)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <Label>Current Medications</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Add current medication"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addItem("currentMedications", newMedication))
                    }
                  />
                  <Button type="button" onClick={() => addItem("currentMedications", newMedication)} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.currentMedications.map((medication, index) => (
                    <Badge key={index} variant="default" className="gap-1">
                      {medication}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem("currentMedications", index)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <h3 className="text-lg font-semibold">Location Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                    placeholder="District name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData((prev) => ({ ...prev, village: e.target.value }))}
                    placeholder="Village name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="householdId">Household ID</Label>
                  <Input
                    id="householdId"
                    value={formData.householdId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, householdId: e.target.value }))}
                    placeholder="HH-001"
                  />
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {initialData ? "Update Patient" : "Register Patient"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

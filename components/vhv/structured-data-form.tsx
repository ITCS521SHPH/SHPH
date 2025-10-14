"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, FileText, Activity, User, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { intakesApi } from "@/lib/api"
import { saveFormDataOffline, getOfflineFormData, offlineStorage } from "@/lib/offline-storage"

interface StructuredDataFormProps {
  patient: {
    id: number
    name: string
    hospitalNumber?: string
  }
  intakeId?: string | null
  onSectionComplete: (section: string) => void
  onFormComplete: () => void
  completedSections: string[]
}

export function StructuredDataForm({
  patient,
  intakeId,
  onSectionComplete,
  onFormComplete,
  completedSections,
}: StructuredDataFormProps) {
  const [vhvName, setVhvName] = useState("Maria Santos")
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const [formData, setFormData] = useState({
    // Patient Information
    patientFullName: patient.name,
    hospitalNumber: patient.hospitalNumber || "",

    // Vital Signs
    oxygenSaturation: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    bloodGlucose: "",

    // Physical Function & Performance
    dyspneaScore: "",
    balanceScore: "",
    ipaqScore: "",
    sitToStandReps: "",
    sixMinuteWalk: "",
    sppbScore: "",
    gripStrengthRight: "",
    gripStrengthLeft: "",

    // Mental, Cognitive & Fatigue Assessment
    mocaScore: "",
    fatigueSeverityScale: "",
    facitFatigueScale: "",
    chalderFatigueScale: "",
    gad7Score: "",
    hadsAnxietyScore: "",
    hadsDepressionScore: "",
    beckScore: "",
    iesrScore: "",

    // VHV Notes
    patientConcerns: "",
    vhvObservations: "",
  })

  const sections = [
    {
      id: "patientInfo",
      title: "Patient Information",
      icon: User,
      fields: ["patientFullName", "hospitalNumber"],
      completed: completedSections.includes("patientInfo"),
    },
    {
      id: "vitalSigns",
      title: "Vital Signs",
      icon: Heart,
      fields: ["oxygenSaturation", "bloodPressureSystolic", "bloodPressureDiastolic", "heartRate", "bloodGlucose"],
      completed: completedSections.includes("vitalSigns"),
    },
    {
      id: "physicalFunction",
      title: "Physical Function & Performance",
      icon: Activity,
      fields: [
        "dyspneaScore",
        "balanceScore",
        "ipaqScore",
        "sitToStandReps",
        "sixMinuteWalk",
        "sppbScore",
        "gripStrengthRight",
        "gripStrengthLeft",
      ],
      completed: completedSections.includes("physicalFunction"),
    },
    {
      id: "mentalCognitive",
      title: "Mental, Cognitive & Fatigue Assessment",
      icon: FileText,
      fields: [
        "mocaScore",
        "fatigueSeverityScale",
        "facitFatigueScale",
        "chalderFatigueScale",
        "gad7Score",
        "hadsAnxietyScore",
        "hadsDepressionScore",
        "beckScore",
        "iesrScore",
      ],
      completed: completedSections.includes("mentalCognitive"),
    },
    {
      id: "vhvNotes",
      title: "VHV Notes & Visit Confirmation",
      icon: FileText,
      fields: ["patientConcerns", "vhvObservations"],
      completed: completedSections.includes("vhvNotes"),
    },
  ]

  // Save data to backend with debouncing and offline fallback
  const saveToBackend = async (updatedData: any) => {
    if (!intakeId) return
    
    try {
      console.log('Saving form data:', updatedData)
      if (offlineStorage.isOnline()) {
        await intakesApi.update(intakeId, updatedData)
        console.log('Form data saved to backend')
      } else {
        // Save offline when no internet connection
        await saveFormDataOffline(patient.id.toString(), intakeId, updatedData, completedSections)
        console.log('Form data saved offline')
      }
    } catch (error) {
      console.error('Failed to save form data:', error)
      // Fallback to offline storage if API call fails
      try {
        console.log('Falling back to offline storage')
        await saveFormDataOffline(patient.id.toString(), intakeId, updatedData, completedSections)
        console.log('Form data saved offline as fallback')
      } catch (offlineError) {
        console.error('Failed to save offline:', offlineError)
      }
    }
  }

  // Load offline data on component mount
  useEffect(() => {
    const loadOfflineData = async () => {
      try {
        console.log('Loading offline data for patient:', patient.id)
        const offlineData = await getOfflineFormData(patient.id.toString())
        console.log('Retrieved offline data:', offlineData)
        
        if (offlineData && offlineData.formData) {
          console.log('Setting form data from offline storage:', offlineData.formData)
          setFormData(prev => {
            const updated = { ...prev, ...offlineData.formData }
            console.log('Updated form data:', updated)
            return updated
          })
        }
        // Also load completed sections if available
        if (offlineData && offlineData.completedSections) {
          console.log('Loading completed sections:', offlineData.completedSections)
          // Update completed sections through the parent component
          offlineData.completedSections.forEach((section: string) => {
            if (!completedSections.includes(section)) {
              console.log('Marking section as complete:', section)
              onSectionComplete(section)
            }
          })
        }
        
        // Mark data as loaded to prevent premature saves
        setIsDataLoaded(true)
        console.log('Data loading completed')
      } catch (error) {
        console.error('Failed to load offline data:', error)
        setIsDataLoaded(true) // Still mark as loaded even if there's an error
      }
    }
    
    loadOfflineData()
  }, [patient.id]) // Only depend on patient.id to avoid loops

  // Debounced save function for form data
  useEffect(() => {
    // Only save if data has been loaded to prevent saving empty initial state
    if (!isDataLoaded) {
      console.log('Skipping save - data not loaded yet')
      return
    }
    
    const timeoutId = setTimeout(() => {
      if (intakeId) {
        console.log('Auto-saving form data after delay')
        saveToBackend(formData)
      }
    }, 1000) // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData, intakeId, isDataLoaded])

  // Save completed sections whenever they change
  useEffect(() => {
    // Only save if data has been loaded
    if (!isDataLoaded) {
      console.log('Skipping completed sections save - data not loaded yet')
      return
    }
    
    const saveCompletedSections = async () => {
      if (completedSections.length > 0) {
        try {
          await saveFormDataOffline(patient.id.toString(), intakeId || null, formData, completedSections)
          console.log('Saved completed sections:', completedSections)
        } catch (error) {
          console.error('Failed to save completed sections:', error)
        }
      }
    }
    
    saveCompletedSections()
  }, [completedSections, patient.id, intakeId, formData, isDataLoaded])

  const updateFormData = (field: string, value: string) => {
    console.log('Updating form field:', field, 'with value:', value)
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      console.log('Form data updated:', updated)
      return updated
    })
  }

  const handleSectionComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      console.log("[v0] Marking section complete:", sectionId)
      onSectionComplete(sectionId)
    } else {
      console.log("[v0] Section already completed:", sectionId)
    }
  }

  const isSectionComplete = (section: any) => {
    return section.fields.every((field: string) => formData[field as keyof typeof formData]?.trim() !== "")
  }

  const overallProgress = Math.round((completedSections.length / sections.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Home Visit - Data Collection Form
              </CardTitle>
              <CardDescription>
                VHV: {vhvName} • Date: {visitDate}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={overallProgress} className="w-32" />
              <span className="text-sm font-medium">{overallProgress}% Complete</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section 1: Patient Information */}
      <Card className={sections[0].completed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              1. Patient Information
            </span>
            {sections[0].completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientFullName">Patient Full Name</Label>
              <Input
                id="patientFullName"
                value={formData.patientFullName}
                onChange={(e) => updateFormData("patientFullName", e.target.value)}
                placeholder="Enter patient's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospitalNumber">Hospital Number (HN)</Label>
              <Input
                id="hospitalNumber"
                value={formData.hospitalNumber}
                onChange={(e) => updateFormData("hospitalNumber", e.target.value)}
                placeholder="Enter hospital number"
              />
            </div>
          </div>
          {!sections[0].completed && isSectionComplete(sections[0]) && (
            <Button onClick={() => handleSectionComplete("patientInfo")} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Section Complete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Vital Signs */}
      <Card className={sections[1].completed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              2. Vital Signs
            </span>
            {sections[1].completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oxygenSaturation">Oxygen Saturation (SpO₂) %</Label>
              <Input
                id="oxygenSaturation"
                value={formData.oxygenSaturation}
                onChange={(e) => updateFormData("oxygenSaturation", e.target.value)}
                placeholder="e.g., 98"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGlucose">Blood Glucose (DTX) mg/dL</Label>
              <Input
                id="bloodGlucose"
                value={formData.bloodGlucose}
                onChange={(e) => updateFormData("bloodGlucose", e.target.value)}
                placeholder="e.g., 120"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodPressureSystolic">Blood Pressure - Systolic mmHg</Label>
              <Input
                id="bloodPressureSystolic"
                value={formData.bloodPressureSystolic}
                onChange={(e) => updateFormData("bloodPressureSystolic", e.target.value)}
                placeholder="e.g., 120"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodPressureDiastolic">Blood Pressure - Diastolic mmHg</Label>
              <Input
                id="bloodPressureDiastolic"
                value={formData.bloodPressureDiastolic}
                onChange={(e) => updateFormData("bloodPressureDiastolic", e.target.value)}
                placeholder="e.g., 80"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
              <Input
                id="heartRate"
                value={formData.heartRate}
                onChange={(e) => updateFormData("heartRate", e.target.value)}
                placeholder="e.g., 72"
                type="number"
              />
            </div>
          </div>
          {!sections[1].completed && isSectionComplete(sections[1]) && (
            <Button onClick={() => handleSectionComplete("vitalSigns")} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Section Complete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Physical Function & Performance */}
      <Card className={sections[2].completed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              3. Physical Function & Performance
            </span>
            {sections[2].completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dyspneaScore">Dyspnea (mMRC Scale) Score (0-4)</Label>
              <Select value={formData.dyspneaScore} onValueChange={(value) => updateFormData("dyspneaScore", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - No breathlessness</SelectItem>
                  <SelectItem value="1">1 - Breathless on strenuous exercise</SelectItem>
                  <SelectItem value="2">2 - Breathless on walking uphill</SelectItem>
                  <SelectItem value="3">3 - Breathless on level walking</SelectItem>
                  <SelectItem value="4">4 - Breathless at rest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceScore">Balance - ABC Scale Score %</Label>
              <Input
                id="balanceScore"
                value={formData.balanceScore}
                onChange={(e) => updateFormData("balanceScore", e.target.value)}
                placeholder="e.g., 85"
                type="number"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipaqScore">Physical Activity - IPAQ Score</Label>
              <Input
                id="ipaqScore"
                value={formData.ipaqScore}
                onChange={(e) => updateFormData("ipaqScore", e.target.value)}
                placeholder="Enter IPAQ score"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sitToStandReps">Sit to Stand Test (repetitions in 30 seconds)</Label>
              <Input
                id="sitToStandReps"
                value={formData.sitToStandReps}
                onChange={(e) => updateFormData("sitToStandReps", e.target.value)}
                placeholder="e.g., 12"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sixMinuteWalk">6-Minute Walk Test (meters)</Label>
              <Input
                id="sixMinuteWalk"
                value={formData.sixMinuteWalk}
                onChange={(e) => updateFormData("sixMinuteWalk", e.target.value)}
                placeholder="e.g., 450"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sppbScore">SPPB Score (0-12)</Label>
              <Input
                id="sppbScore"
                value={formData.sppbScore}
                onChange={(e) => updateFormData("sppbScore", e.target.value)}
                placeholder="e.g., 10"
                type="number"
                max="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gripStrengthRight">Muscle Strength (Grip) - Right Hand (kg)</Label>
              <Input
                id="gripStrengthRight"
                value={formData.gripStrengthRight}
                onChange={(e) => updateFormData("gripStrengthRight", e.target.value)}
                placeholder="e.g., 25"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gripStrengthLeft">Muscle Strength (Grip) - Left Hand (kg)</Label>
              <Input
                id="gripStrengthLeft"
                value={formData.gripStrengthLeft}
                onChange={(e) => updateFormData("gripStrengthLeft", e.target.value)}
                placeholder="e.g., 23"
                type="number"
              />
            </div>
          </div>
          {!sections[2].completed && isSectionComplete(sections[2]) && (
            <Button onClick={() => handleSectionComplete("physicalFunction")} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Section Complete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Mental, Cognitive & Fatigue Assessment */}
      <Card className={sections[3].completed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              4. Mental, Cognitive & Fatigue Assessment
            </span>
            {sections[3].completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mocaScore">Cognitive Function - MoCA Score (0-30)</Label>
              <Input
                id="mocaScore"
                value={formData.mocaScore}
                onChange={(e) => updateFormData("mocaScore", e.target.value)}
                placeholder="e.g., 26"
                type="number"
                max="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatigueSeverityScale">Fatigue Severity Scale</Label>
              <Input
                id="fatigueSeverityScale"
                value={formData.fatigueSeverityScale}
                onChange={(e) => updateFormData("fatigueSeverityScale", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facitFatigueScale">FACIT-Fatigue Scale</Label>
              <Input
                id="facitFatigueScale"
                value={formData.facitFatigueScale}
                onChange={(e) => updateFormData("facitFatigueScale", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chalderFatigueScale">Chalder Fatigue Scale</Label>
              <Input
                id="chalderFatigueScale"
                value={formData.chalderFatigueScale}
                onChange={(e) => updateFormData("chalderFatigueScale", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gad7Score">GAD-7 Score (Anxiety)</Label>
              <Input
                id="gad7Score"
                value={formData.gad7Score}
                onChange={(e) => updateFormData("gad7Score", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hadsAnxietyScore">HADS - Anxiety Score</Label>
              <Input
                id="hadsAnxietyScore"
                value={formData.hadsAnxietyScore}
                onChange={(e) => updateFormData("hadsAnxietyScore", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hadsDepressionScore">HADS - Depression Score</Label>
              <Input
                id="hadsDepressionScore"
                value={formData.hadsDepressionScore}
                onChange={(e) => updateFormData("hadsDepressionScore", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beckScore">Beck Questionnaire Score (Depression)</Label>
              <Input
                id="beckScore"
                value={formData.beckScore}
                onChange={(e) => updateFormData("beckScore", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iesrScore">IES-R Score (Trauma)</Label>
              <Input
                id="iesrScore"
                value={formData.iesrScore}
                onChange={(e) => updateFormData("iesrScore", e.target.value)}
                placeholder="Enter score"
                type="number"
              />
            </div>
          </div>
          {!sections[3].completed && isSectionComplete(sections[3]) && (
            <Button onClick={() => handleSectionComplete("mentalCognitive")} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Section Complete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 5: VHV Notes & Visit Confirmation */}
      <Card className={sections[4].completed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              5. VHV Notes & Visit Confirmation
            </span>
            {sections[4].completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientConcerns">Patient-Reported Concerns</Label>
              <Textarea
                id="patientConcerns"
                value={formData.patientConcerns}
                onChange={(e) => updateFormData("patientConcerns", e.target.value)}
                placeholder="Document any concerns or symptoms reported by the patient..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vhvObservations">VHV Observations</Label>
              <Textarea
                id="vhvObservations"
                value={formData.vhvObservations}
                onChange={(e) => updateFormData("vhvObservations", e.target.value)}
                placeholder="Record your observations about the patient's condition, behavior, environment, etc..."
                rows={4}
              />
            </div>
          </div>
          {!sections[4].completed && isSectionComplete(sections[4]) && (
            <Button onClick={() => handleSectionComplete("vhvNotes")} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Section Complete
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Complete Form Button */}
      {overallProgress === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-lg font-medium text-green-800">All Sections Complete!</span>
              </div>
              <p className="text-green-700">
                All required data has been collected. You can now proceed to review and submit the data.
              </p>
              <Button onClick={onFormComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Data Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

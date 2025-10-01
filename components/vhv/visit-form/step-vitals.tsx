"use client"

import { useVisitForm } from "./visit-form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export function StepVitals() {
  const { state, updateField } = useVisitForm()

  const validateBloodPressure = (value: string) => {
    return value === "" || /^[0-9]{2,3}\/[0-9]{2}$/.test(value)
  }

  const validateHeartRate = (value: string) => {
    if (value === "") return true
    const hr = Number.parseInt(value)
    return !isNaN(hr) && hr >= 40 && hr <= 220
  }

  const validateTemperature = (value: string) => {
    if (value === "") return true
    const temp = Number.parseFloat(value)
    return !isNaN(temp) && temp >= 30.0 && temp <= 43.0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Vital Signs</CardTitle>
        <CardDescription>Record the patient's vital signs (all fields are optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bloodPressure">Blood Pressure</Label>
            <Input
              id="bloodPressure"
              placeholder="120/80"
              value={state.formData.bloodPressure}
              onChange={(e) => updateField("bloodPressure", e.target.value)}
              className={!validateBloodPressure(state.formData.bloodPressure) ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">Format: ###/## (e.g., 120/80)</p>
            {!validateBloodPressure(state.formData.bloodPressure) && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">Invalid format. Use ###/## (e.g., 120/80)</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="heartRate">Heart Rate (BPM)</Label>
            <Input
              id="heartRate"
              type="number"
              placeholder="75"
              min="40"
              max="220"
              value={state.formData.heartRate}
              onChange={(e) => updateField("heartRate", e.target.value)}
              className={!validateHeartRate(state.formData.heartRate) ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">Range: 40-220 BPM</p>
            {!validateHeartRate(state.formData.heartRate) && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">Heart rate must be between 40 and 220 BPM</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature (°C)</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="36.5"
              min="30.0"
              max="43.0"
              value={state.formData.temperature}
              onChange={(e) => updateField("temperature", e.target.value)}
              className={!validateTemperature(state.formData.temperature) ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">Range: 30.0-43.0°C</p>
            {!validateTemperature(state.formData.temperature) && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">Temperature must be between 30.0 and 43.0°C</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            All vital signs are optional but recommended for a complete assessment. Ensure measurements are accurate and
            taken properly.
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Measurement guidelines:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Blood pressure: Patient should be seated and relaxed</li>
            <li>• Heart rate: Count for full 60 seconds or use reliable device</li>
            <li>• Temperature: Use calibrated thermometer, note measurement site</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

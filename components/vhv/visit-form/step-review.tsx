"use client"

import { useVisitForm } from "./visit-form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export function StepReview() {
  const { state } = useVisitForm()
  const { formData } = state

  const isComplete = formData.symptoms.length >= 5

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Review & Submit</CardTitle>
        <CardDescription>Review all information before submitting the visit record</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isComplete && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please complete all required fields before submitting.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              Symptoms
              <Badge variant={formData.symptoms.length >= 5 ? "default" : "destructive"}>
                {formData.symptoms.length >= 5 ? "Complete" : "Required"}
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{formData.symptoms || "No symptoms recorded"}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2">
              Vital Signs
              <Badge variant="secondary">Optional</Badge>
            </h3>
            <div className="grid gap-2 mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blood Pressure:</span>
                <span>{formData.bloodPressure || "Not recorded"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Heart Rate:</span>
                <span>{formData.heartRate ? `${formData.heartRate} BPM` : "Not recorded"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span>{formData.temperature ? `${formData.temperature}°C` : "Not recorded"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2">
              Additional Notes
              <Badge variant="secondary">Optional</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{formData.notes || "No additional notes"}</p>
          </div>
        </div>

        {isComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All required information has been provided. The record will be submitted for doctor review.
            </AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">After submission:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• The record will be sent to a doctor for review</li>
            <li>• You'll be able to track the status in your dashboard</li>
            <li>• The patient will be notified once reviewed</li>
            <li>• You can save as draft if you need to complete it later</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

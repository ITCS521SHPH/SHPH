"use client"

import { useVisitForm } from "./visit-form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function StepSymptoms() {
  const { state, updateField } = useVisitForm()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Symptoms</CardTitle>
        <CardDescription>Describe the patient's symptoms in detail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="symptoms">
            Symptoms <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="symptoms"
            placeholder="Describe the patient's symptoms (minimum 5 characters)..."
            value={state.formData.symptoms}
            onChange={(e) => updateField("symptoms", e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">Characters: {state.formData.symptoms.length}/5 minimum</p>
        </div>

        {state.formData.symptoms.length > 0 && state.formData.symptoms.length < 5 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Symptoms description must be at least 5 characters long</AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Guidelines for symptom documentation:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Include onset, duration, and severity</li>
            <li>• Note any associated symptoms</li>
            <li>• Mention what makes symptoms better or worse</li>
            <li>• Include patient's own words when possible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

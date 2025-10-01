"use client"

import { useVisitForm } from "./visit-form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function StepNotes() {
  const { state, updateField } = useVisitForm()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Additional Notes</CardTitle>
        <CardDescription>Add any additional observations or notes about the visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional observations, patient concerns, or relevant information..."
            value={state.formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">Characters: {state.formData.notes.length}</p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Use this section to document any additional observations, patient concerns, environmental factors, or other
            relevant information that may help with diagnosis and treatment.
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Consider including:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Patient's general appearance and demeanor</li>
            <li>• Environmental or social factors</li>
            <li>• Patient's concerns or questions</li>
            <li>• Any medications currently being taken</li>
            <li>• Follow-up recommendations or referrals needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

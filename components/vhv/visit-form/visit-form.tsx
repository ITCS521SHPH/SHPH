"use client"

import { VisitFormProvider, useVisitForm } from "./visit-form-context"
import { StepSymptoms } from "./step-symptoms"
import { StepVitals } from "./step-vitals"
import { StepNotes } from "./step-notes"
import { StepReview } from "./step-review"
import { VisitFormNavigation } from "./visit-form-navigation"

function VisitFormContent() {
  const { state } = useVisitForm()

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <StepSymptoms />
      case 1:
        return <StepVitals />
      case 2:
        return <StepNotes />
      case 3:
        return <StepReview />
      default:
        return <StepSymptoms />
    }
  }

  return (
    <div className="space-y-6">
      {renderStep()}
      <VisitFormNavigation />
    </div>
  )
}

interface VisitFormProps {
  patientId: string
}

export function VisitForm({ patientId }: VisitFormProps) {
  return (
    <VisitFormProvider patientId={patientId}>
      <VisitFormContent />
    </VisitFormProvider>
  )
}

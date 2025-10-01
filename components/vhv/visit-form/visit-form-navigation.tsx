"use client"

import { useVisitForm } from "./visit-form-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Save, Send, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"

const steps = ["Symptoms", "Vitals", "Notes", "Review"]

export function VisitFormNavigation() {
  const { state, nextStep, prevStep, saveDraft, submitForm, validateCurrentStep } = useVisitForm()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const progress = ((state.currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep()
    }
  }

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      await submitForm()
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {state.currentStep + 1} of {steps.length}
              </span>
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-600" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-orange-600" />
                    Offline
                  </>
                )}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <span key={step} className={index <= state.currentStep ? "text-primary font-medium" : ""}>
                  {step}
                </span>
              ))}
            </div>
          </div>

          {/* Error display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Draft status */}
          {state.isDraft && (
            <Alert>
              <Save className="h-4 w-4" />
              <AlertDescription>Draft saved. You can continue editing or submit when ready.</AlertDescription>
            </Alert>
          )}

          {/* Offline notice */}
          {!isOnline && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're currently offline. Changes will be saved locally and synced when connection is restored.
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={prevStep} disabled={state.currentStep === 0 || state.isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={state.isLoading}>
                {state.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Draft
              </Button>

              {state.currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={state.isLoading}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={state.isLoading || !validateCurrentStep()}>
                  {state.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Submit Record
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

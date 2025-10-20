"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Phone, Zap, CheckCircle, Clock } from "lucide-react"
import { EmergencyPriority, EmergencyStatus, type CreateEmergencyAlertRequest, type EmergencyAlert } from "@/lib/types"
import { emergencyApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EmergencyButtonProps {
  patientId: string
  patientName: string
  onEmergencyTriggered?: (alert: CreateEmergencyAlertRequest) => void
  disabled?: boolean
}

export function EmergencyButton({
  patientId,
  patientName,
  onEmergencyTriggered,
  disabled = false,
}: EmergencyButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeEmergency, setActiveEmergency] = useState<EmergencyAlert | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    const checkActiveEmergency = async () => {
      try {
        setIsLoadingStatus(true)
        const alerts = await emergencyApi.getByPatient(patientId)

        const latestAlert =
          alerts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null

        const activeAlert =
          latestAlert &&
          (latestAlert.status === EmergencyStatus.ACTIVE || latestAlert.status === EmergencyStatus.ACKNOWLEDGED)
            ? latestAlert
            : null

        setActiveEmergency(activeAlert)
        console.log("[v0] Active emergency status:", activeAlert ? "Active" : "None")
        if (activeAlert) {
          console.log("[v0] Active emergency details:", {
            id: activeAlert.id,
            status: activeAlert.status,
            createdAt: activeAlert.createdAt,
          })
        }
      } catch (error) {
        console.error("[v0] Failed to check emergency status:", error)
        setActiveEmergency(null)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    checkActiveEmergency()

    const interval = setInterval(checkActiveEmergency, 30000)
    return () => clearInterval(interval)
  }, [patientId])

  const handleEmergencyTriggerImmediate = async () => {
    if (isSubmitting || activeEmergency) return
    if (!patientId) {
      alert("Unable to send an emergency alert because no patient record is linked to this account.")
      return
    }

    setIsSubmitting(true)

    const emergencyAlert: CreateEmergencyAlertRequest = {
      patientId,
      priority: EmergencyPriority.HIGH,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    }

    try {
      console.log("[v0] Emergency alert triggered:", emergencyAlert)
      const newAlert = await emergencyApi.create(emergencyAlert)
      console.log("[v0] Emergency alert successfully sent to healthcare providers")

      setActiveEmergency(newAlert)
      onEmergencyTriggered?.(emergencyAlert)

      alert("Emergency alert sent! Healthcare providers have been notified.")
    } catch (error) {
      console.error("[v0] Failed to trigger emergency alert:", error)
      alert("Failed to send emergency alert. Please try again or call emergency services directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmergencyTrigger = async () => {
    if (isSubmitting || activeEmergency) return
    if (!patientId) {
      alert("Unable to send an emergency alert because no patient record is linked to this account.")
      return
    }

    setIsSubmitting(true)

    const emergencyAlert: CreateEmergencyAlertRequest = {
      patientId,
      priority: EmergencyPriority.HIGH,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    }

    try {
      console.log("[v0] Emergency alert triggered:", emergencyAlert)
      const newAlert = await emergencyApi.create(emergencyAlert)
      console.log("[v0] Emergency alert successfully sent to healthcare providers")

      setActiveEmergency(newAlert)
      onEmergencyTriggered?.(emergencyAlert)

      setDescription("")
      setLocation("")
      setIsOpen(false)
      setShowDetailsDialog(false)
    } catch (error) {
      console.error("[v0] Failed to trigger emergency alert:", error)
      alert("Failed to send emergency alert. Please try again or call emergency services directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return

    try {
      console.log("[v0] Cancelling emergency alert:", activeEmergency.id)
      await emergencyApi.cancel(activeEmergency.id, "Cancelled by patient")

      setActiveEmergency(null)

      setDescription("")
      setLocation("")

      console.log("[v0] Emergency alert cancelled successfully")

      alert("Emergency alert cancelled.")
    } catch (error) {
      console.error("[v0] Failed to cancel emergency:", error)
      alert("Failed to cancel emergency alert.")
    }
  }

  if (isLoadingStatus) {
    return (
      <Card className="border-2 border-gray-300 bg-gray-50 dark:bg-gray-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Checking Emergency Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we check your current emergency status...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeEmergency) {
    const getStatusColor = (status: EmergencyStatus) => {
      switch (status) {
        case EmergencyStatus.ACTIVE:
          return "border-red-500 bg-red-50 dark:bg-red-950/20"
        case EmergencyStatus.ACKNOWLEDGED:
          return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
        default:
          return "border-gray-500 bg-gray-50 dark:bg-gray-950/20"
      }
    }

    const getStatusText = (status: EmergencyStatus) => {
      switch (status) {
        case EmergencyStatus.ACTIVE:
          return "Emergency Alert Active"
        case EmergencyStatus.ACKNOWLEDGED:
          return "Emergency Acknowledged"
        case EmergencyStatus.RESOLVED:
          return "Emergency Resolved"
        case EmergencyStatus.CANCELLED:
          return "Emergency Cancelled"
        default:
          return "Emergency Status Unknown"
      }
    }

    const getStatusIcon = (status: EmergencyStatus) => {
      switch (status) {
        case EmergencyStatus.ACTIVE:
          return <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
        case EmergencyStatus.ACKNOWLEDGED:
          return <CheckCircle className="h-8 w-8 text-yellow-500" />
        default:
          return <Clock className="h-8 w-8 text-gray-500" />
      }
    }

    return (
      <Card className={`border-2 ${getStatusColor(activeEmergency.status)}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                {getStatusIcon(activeEmergency.status)}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">
                {getStatusText(activeEmergency.status)}
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {activeEmergency.status === EmergencyStatus.ACTIVE
                  ? "Your emergency alert is active. Healthcare providers have been notified."
                  : "Your emergency has been acknowledged by healthcare providers."}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <strong>Priority:</strong> {activeEmergency.priority}
                </p>
                <p>
                  <strong>Time:</strong> {new Date(activeEmergency.createdAt).toLocaleString()}
                </p>
                {activeEmergency.description && (
                  <p>
                    <strong>Description:</strong> {activeEmergency.description}
                  </p>
                )}
                {activeEmergency.location && (
                  <p>
                    <strong>Location:</strong> {activeEmergency.location}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {activeEmergency.status === EmergencyStatus.ACTIVE && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEmergency}
                    className="border-red-500 text-red-600 hover:bg-red-50 bg-transparent"
                  >
                    Cancel Emergency
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="text-center">
                <Phone className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-red-600 dark:text-red-400">Or call 911</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-red-700 dark:text-red-300 mb-1">Emergency Help</h3>
            <p className="text-xs md:text-sm text-red-600 dark:text-red-400 mb-3">
              Press this button if you need immediate medical assistance
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 md:px-8 py-2 md:py-3 text-base md:text-lg w-full sm:w-auto"
                disabled={disabled || !!activeEmergency || isSubmitting}
                onClick={handleEmergencyTriggerImmediate}
              >
                <Zap className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                {isSubmitting ? "SENDING..." : activeEmergency ? "EMERGENCY SENT" : "EMERGENCY"}
              </Button>

              {!activeEmergency && (
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-red-500 text-red-600 hover:bg-red-50 w-full sm:w-auto text-sm md:text-base bg-transparent"
                      disabled={disabled || !!activeEmergency}
                    >
                      Add Details
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Emergency Alert Details
                      </DialogTitle>
                      <DialogDescription>
                        Provide additional information to help healthcare providers respond more effectively.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">What's happening? (Optional)</label>
                        <Textarea
                          placeholder="Describe your symptoms or situation..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Your location (Optional)</label>
                        <Textarea
                          placeholder="Where are you right now?"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDetailsDialog(false)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEmergencyTrigger}
                        disabled={isSubmitting || !patientId || disabled}
                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                      >
                        {isSubmitting ? "Sending Alert..." : "Send Emergency Alert"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="text-center">
              <Phone className="h-5 w-5 md:h-6 md:w-6 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-red-600 dark:text-red-400">Or call 911</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

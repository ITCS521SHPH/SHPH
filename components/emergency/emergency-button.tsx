"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Phone, Zap, CheckCircle, Clock } from "lucide-react"
import { EmergencyPriority, EmergencyStatus, type CreateEmergencyAlertRequest, type EmergencyAlert } from "@/lib/types"
import { emergencyApi } from "@/lib/api"

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
  const [priority, setPriority] = useState<EmergencyPriority>(EmergencyPriority.HIGH)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeEmergency, setActiveEmergency] = useState<EmergencyAlert | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  useEffect(() => {
    const checkActiveEmergency = async () => {
      try {
        setIsLoadingStatus(true)
        const alerts = await emergencyApi.getByPatient(patientId)
        
        // Get the most recent alert (regardless of status)
        const latestAlert = alerts
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
        
        // Only set activeEmergency if the latest alert is ACTIVE or ACKNOWLEDGED
        // If the latest alert is RESOLVED or CANCELLED, clear activeEmergency
        const activeAlert = latestAlert && 
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

    // Check every 30 seconds for status updates
    const interval = setInterval(checkActiveEmergency, 30000)
    return () => clearInterval(interval)
  }, [patientId])

  const handleEmergencyTrigger = async () => {
    if (isSubmitting || activeEmergency) return

    setIsSubmitting(true)

    const emergencyAlert: CreateEmergencyAlertRequest = {
      patientId,
      priority,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    }

    try {
      // Call the emergency API
      console.log("[v0] Emergency alert triggered:", emergencyAlert)
      const newAlert = await emergencyApi.create(emergencyAlert)
      console.log("[v0] Emergency alert successfully sent to healthcare providers")

      setActiveEmergency(newAlert)

      // Trigger callback if provided
      onEmergencyTriggered?.(emergencyAlert)

      // Reset form
      setDescription("")
      setLocation("")
      setPriority(EmergencyPriority.HIGH)
      
      // Close dialog after successful submission
      setIsOpen(false)

      // Show success feedback
      alert("Emergency alert sent! Help is on the way.")
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
      
      // Immediately clear the active emergency
      setActiveEmergency(null)
      
      // Reset form state
      setDescription("")
      setLocation("")
      setPriority(EmergencyPriority.HIGH)
      
      console.log("[v0] Emergency alert cancelled successfully")
      
      // The status will be automatically refreshed by the 30-second interval in useEffect
      
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
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">Emergency Help</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              Press this button if you need immediate medical assistance
            </p>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 text-lg"
                  disabled={disabled || !!activeEmergency}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {activeEmergency ? "EMERGENCY SENT" : "EMERGENCY"}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Alert
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately notify your doctor and VHV. Please provide details about your emergency.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Emergency Priority</label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as EmergencyPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EmergencyPriority.CRITICAL}>Critical - Life threatening</SelectItem>
                        <SelectItem value={EmergencyPriority.HIGH}>High - Urgent medical attention needed</SelectItem>
                        <SelectItem value={EmergencyPriority.MEDIUM}>Medium - Medical assistance needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEmergencyTrigger}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isSubmitting ? "Sending Alert..." : "Send Emergency Alert"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

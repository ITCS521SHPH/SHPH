"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Clock, MapPin, CheckCircle, Phone, Zap, Bell } from "lucide-react"
import { emergencyApi } from "@/lib/api"
import { EmergencyStatus, EmergencyPriority, type EmergencyAlert, UserRole } from "@/lib/types"

interface EmergencyAlertsProps {
  userId: string
  userRole: UserRole
  showActiveOnly?: boolean
}

/* ------------------------- Reusable Components ------------------------- */

function ResolveDialog({
  alert,
  responseNotes,
  setResponseNotes,
  handleResolve,
  isResponding,
}: {
  alert: EmergencyAlert
  responseNotes: string
  setResponseNotes: (val: string) => void
  handleResolve: (id: string) => void
  isResponding: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Emergency Alert</DialogTitle>
          <DialogDescription>
            Mark this emergency as resolved and add any notes about the response.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label htmlFor="response-notes">Response Notes (Optional)</Label>
          <Textarea
            id="response-notes"
            placeholder="Describe the actions taken to resolve this emergency..."
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => handleResolve(alert.id)}
            disabled={isResponding}
            className="bg-green-600 hover:bg-green-700"
          >
            {isResponding ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusInfo({
  type,
  at,
  extra,
}: {
  type: "Acknowledged" | "Resolved"
  at?: string
  extra?: string
}) {
  const styles =
    type === "Acknowledged"
      ? "bg-yellow-50 border-yellow-200"
      : "bg-green-50 border-green-200"

  return (
    <div className={`mt-3 p-2 border rounded text-sm ${styles}`}>
      <p>
        <strong>{type}</strong> {at && `at ${new Date(at).toLocaleString()}`}{" "}
        {extra && extra}
      </p>
    </div>
  )
}

/* --------------------------- Main Component --------------------------- */

export function EmergencyAlerts({ userId, userRole, showActiveOnly = false }: EmergencyAlertsProps) {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [responseNotes, setResponseNotes] = useState("")
  const [isResponding, setIsResponding] = useState(false)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      let fetchedAlerts: EmergencyAlert[] = []

      if (userRole === UserRole.DOCTOR) {
        fetchedAlerts = await emergencyApi.getByDoctor(userId, showActiveOnly ? EmergencyStatus.ACTIVE : undefined)
      } else if (userRole === UserRole.VHV) {
        fetchedAlerts = await emergencyApi.getByVHV(userId, showActiveOnly ? EmergencyStatus.ACTIVE : undefined)
      } else if (userRole === UserRole.PATIENT) {
        fetchedAlerts = await emergencyApi.getByPatient(userId)
      } else {
        fetchedAlerts = await emergencyApi.getAll()
      }

      setAlerts(fetchedAlerts)
    } catch (error) {
      console.error("[v0] Failed to fetch emergency alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [userId, userRole, showActiveOnly])

  const handleAcknowledge = async (alertId: string) => {
    try {
      setIsResponding(true)
      await emergencyApi.acknowledge(alertId, userId)
      await fetchAlerts()
    } catch (error) {
      console.error("[v0] Failed to acknowledge alert:", error)
      alert("Failed to acknowledge alert. Please try again.")
    } finally {
      setIsResponding(false)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      setIsResponding(true)
      await emergencyApi.resolve(alertId, userId, responseNotes.trim() || undefined)
      setResponseNotes("")
      await fetchAlerts()
    } catch (error) {
      console.error("[v0] Failed to resolve alert:", error)
      alert("Failed to resolve alert. Please try again.")
    } finally {
      setIsResponding(false)
    }
  }

  const handleCancel = async (alertId: string) => {
    try {
      setIsResponding(true)
      await emergencyApi.cancel(alertId, "Cancelled by healthcare provider")
      await fetchAlerts()
    } catch (error) {
      console.error("[v0] Failed to cancel alert:", error)
      alert("Failed to cancel alert. Please try again.")
    } finally {
      setIsResponding(false)
    }
  }

  const getPriorityColor = (priority: EmergencyPriority) => {
    switch (priority) {
      case EmergencyPriority.CRITICAL:
        return "bg-red-600 text-white"
      case EmergencyPriority.HIGH:
        return "bg-orange-500 text-white"
      case EmergencyPriority.MEDIUM:
        return "bg-yellow-500 text-black"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: EmergencyStatus) => {
    switch (status) {
      case EmergencyStatus.ACTIVE:
        return "bg-red-100 text-red-800 border-red-200"
      case EmergencyStatus.ACKNOWLEDGED:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case EmergencyStatus.RESOLVED:
        return "bg-green-100 text-green-800 border-green-200"
      case EmergencyStatus.CANCELLED:
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading emergency alerts...</div>
        </CardContent>
      </Card>
    )
  }

  const activeAlerts = alerts.filter(
    (alert) => alert.status === EmergencyStatus.ACTIVE || alert.status === EmergencyStatus.ACKNOWLEDGED,
  )

  return (
    <div className="space-y-4">
      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            <strong>
              {activeAlerts.length} active emergency alert{activeAlerts.length > 1 ? "s" : ""}
            </strong>{" "}
            requiring immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Emergency Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Emergency Alerts
            {activeAlerts.length > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">{activeAlerts.length} Active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {showActiveOnly ? "Active emergency alerts requiring your response" : "All emergency alerts in your care"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No emergency alerts at this time</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  alert.status === EmergencyStatus.ACTIVE
                    ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
                    : alert.status === EmergencyStatus.ACKNOWLEDGED
                      ? "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10"
                      : "border-l-green-500"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{alert.patientName}</h4>
                        <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                        <Badge variant="outline" className={getStatusColor(alert.status)}>
                          {alert.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {alert.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Situation:</strong> {alert.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {getTimeAgo(alert.createdAt)}
                        </div>
                        {alert.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {alert.location}
                          </div>
                        )}
                        {alert.responseTime && (
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            Response: {alert.responseTime}min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    {alert.status === EmergencyStatus.ACTIVE && (
                      <>
                        <Button
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={isResponding}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                        <ResolveDialog
                          alert={alert}
                          responseNotes={responseNotes}
                          setResponseNotes={setResponseNotes}
                          handleResolve={handleResolve}
                          isResponding={isResponding}
                        />
                        <Button
                          onClick={() => handleCancel(alert.id)}
                          disabled={isResponding}
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {alert.status === EmergencyStatus.ACKNOWLEDGED && (
                      <ResolveDialog
                        alert={alert}
                        responseNotes={responseNotes}
                        setResponseNotes={setResponseNotes}
                        handleResolve={handleResolve}
                        isResponding={isResponding}
                      />
                    )}

                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Patient
                    </Button>
                  </div>

                  {/* Status Info */}
                  {alert.acknowledgedBy && (
                    <StatusInfo type="Acknowledged" at={alert.acknowledgedAt} />
                  )}
                  {alert.resolvedBy && (
                    <StatusInfo
                      type="Resolved"
                      at={alert.resolvedAt}
                      extra={alert.responseTime && ` (Response time: ${alert.responseTime} minutes)`}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

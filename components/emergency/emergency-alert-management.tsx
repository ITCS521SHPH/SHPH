"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Clock, CheckCircle, XCircle, Search, Filter, Phone, MessageSquare } from "lucide-react"
import type { EmergencyAlert, EmergencyAlertStatus } from "@/lib/types"
import { emergencyApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

export function EmergencyAlertManagement() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<EmergencyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<EmergencyAlertStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all")

  useEffect(() => {
    loadAlerts()
  }, [])

  useEffect(() => {
    filterAlerts()
  }, [alerts, searchTerm, statusFilter, priorityFilter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const data = await emergencyApi.getAll()
      setAlerts(data)
    } catch (error) {
      console.error("Failed to load emergency alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAlerts = () => {
    let filtered = alerts

    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((alert) => alert.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.priority === priorityFilter)
    }

    setFilteredAlerts(filtered)
  }

  const handleStatusUpdate = async (alertId: string, newStatus: EmergencyAlertStatus) => {
    try {
      await emergencyApi.update(alertId, { status: newStatus })
      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: newStatus } : alert)))
    } catch (error) {
      console.error("Failed to update alert status:", error)
    }
  }

  const getStatusIcon = (status: EmergencyAlertStatus) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "acknowledged":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: EmergencyAlertStatus) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 border-red-200"
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const activeAlerts = filteredAlerts.filter((alert) => alert.status === "active")
  const acknowledgedAlerts = filteredAlerts.filter((alert) => alert.status === "acknowledged")
  const resolvedAlerts = filteredAlerts.filter((alert) => alert.status === "resolved")

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading emergency alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Emergency Alert Management</h2>
          <p className="text-muted-foreground">Monitor and manage all emergency alerts in the system</p>
        </div>
        <Button onClick={loadAlerts} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: EmergencyAlertStatus | "all") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value: "all" | "high" | "medium" | "low") => setPriorityFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acknowledged</p>
                <p className="text-2xl font-bold text-yellow-600">{acknowledgedAlerts.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold text-foreground">{filteredAlerts.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Alerts ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged ({acknowledgedAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlertList alerts={filteredAlerts} onStatusUpdate={handleStatusUpdate} />
        </TabsContent>
        <TabsContent value="active">
          <AlertList alerts={activeAlerts} onStatusUpdate={handleStatusUpdate} />
        </TabsContent>
        <TabsContent value="acknowledged">
          <AlertList alerts={acknowledgedAlerts} onStatusUpdate={handleStatusUpdate} />
        </TabsContent>
        <TabsContent value="resolved">
          <AlertList alerts={resolvedAlerts} onStatusUpdate={handleStatusUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  )

  function AlertList({
    alerts,
    onStatusUpdate,
  }: {
    alerts: EmergencyAlert[]
    onStatusUpdate: (alertId: string, status: EmergencyAlertStatus) => void
  }) {
    if (alerts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No emergency alerts found</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`border-l-4 ${
              alert.status === "active"
                ? "border-l-red-500"
                : alert.status === "acknowledged"
                  ? "border-l-yellow-500"
                  : alert.status === "resolved"
                    ? "border-l-green-500"
                    : "border-l-gray-500"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(alert.status)}
                    <CardTitle className="text-lg">{alert.patientName}</CardTitle>
                    <Badge className={getPriorityColor(alert.priority)}>{alert.priority} priority</Badge>
                    <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                  </div>
                  <CardDescription>
                    Patient ID: {alert.patientId} • {formatDistanceToNow(new Date(alert.createdAt))} ago
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Emergency Message:</h4>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">{alert.message}</p>
                </div>

                {alert.location && (
                  <div>
                    <h4 className="font-medium mb-2">Location:</h4>
                    <p className="text-muted-foreground">{alert.location}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Assigned Doctor: {alert.assignedDoctorName} • VHV: {alert.assignedVhvName}
                  </div>
                  <div className="flex gap-2">
                    {alert.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => onStatusUpdate(alert.id, "acknowledged")}>
                        Acknowledge
                      </Button>
                    )}
                    {alert.status === "acknowledged" && (
                      <Button size="sm" variant="outline" onClick={() => onStatusUpdate(alert.id, "resolved")}>
                        Mark Resolved
                      </Button>
                    )}
                    {(alert.status === "active" || alert.status === "acknowledged") && (
                      <Button size="sm" variant="destructive" onClick={() => onStatusUpdate(alert.id, "cancelled")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}

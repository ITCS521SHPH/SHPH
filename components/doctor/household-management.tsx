"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Users, Plus, AlertTriangle, TrendingUp } from "lucide-react"
import { householdsApi, patientsApi } from "@/lib/api"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"

interface HouseholdManagementProps {
  doctorId: string
}

export function HouseholdManagement({ doctorId }: HouseholdManagementProps) {
  const [households, setHouseholds] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [clusterAnalysis, setClusterAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")

  const [newHouseholdForm, setNewHouseholdForm] = useState({
    district: "all",
    address: "",
    headOfHouseholdId: "",
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [householdsData, patientsData, analysisData] = await Promise.all([
        householdsApi.getByDoctor(doctorId),
        patientsApi.getAll(),
        householdsApi.getClusterAnalysis(doctorId, selectedDistrict),
      ])
      setHouseholds(householdsData)
      setPatients(patientsData)
      setClusterAnalysis(analysisData)
    } catch (error) {
      console.error("[v0] Failed to fetch household data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [doctorId, selectedDistrict])

  const handleCreateHousehold = async () => {
    try {
      await householdsApi.create({
        doctorId,
        district: newHouseholdForm.district,
        address: newHouseholdForm.address,
        headOfHouseholdId: newHouseholdForm.headOfHouseholdId || undefined,
      })
      setShowCreateDialog(false)
      setNewHouseholdForm({ district: "all", address: "", headOfHouseholdId: "" })
      fetchData()
      alert("Household created successfully!")
    } catch (error) {
      console.error("[v0] Failed to create household:", error)
      alert("Failed to create household. Please try again.")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading household data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cluster Analysis Overview */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Disease Cluster Analysis
          </CardTitle>
          <CardDescription>
            Identify potential disease clusters by household and geographic distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold">{households.length}</div>
              <div className="text-sm text-muted-foreground">Total Households</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold">{clusterAnalysis?.clusters?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Identified Clusters</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <div className="text-2xl font-bold">{clusterAnalysis?.highRiskHouseholds || 0}</div>
              <div className="text-sm text-muted-foreground">High-Risk Households</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label>Filter by District:</Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {BANGKOK_DISTRICTS.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Household List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Household Management
              </CardTitle>
              <CardDescription>Group patients by household to track disease patterns and family health</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Household
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Household</DialogTitle>
                  <DialogDescription>
                    Group patients living in the same household for cluster tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>District *</Label>
                    <Select
                      value={newHouseholdForm.district}
                      onValueChange={(value) => setNewHouseholdForm((prev) => ({ ...prev, district: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All districts</SelectItem>
                        {BANGKOK_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newHouseholdForm.address}
                      onChange={(e) => setNewHouseholdForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Full household address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Head of Household (Optional)</Label>
                    <Select
                      value={newHouseholdForm.headOfHouseholdId}
                      onValueChange={(value) => setNewHouseholdForm((prev) => ({ ...prev, headOfHouseholdId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateHousehold}>Create Household</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {households.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No households created yet</p>
              <p className="text-sm mt-2">Create households to track disease clusters</p>
            </div>
          ) : (
            households.map((household: any) => (
              <Card key={household.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Household in {household.district}
                      </h4>
                      <p className="text-sm text-muted-foreground">{household.address}</p>
                    </div>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {household.members?.length || 0} Members
                    </Badge>
                  </div>

                  {household.members && household.members.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <h5 className="font-medium text-sm">Household Members:</h5>
                      <div className="grid gap-2">
                        {household.members.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <p className="font-medium text-sm">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.relationshipType || "Member"} • {member.medicalCondition || "No conditions"}
                              </p>
                            </div>
                            {member.id === household.headOfHouseholdId && (
                              <Badge variant="secondary" className="text-xs">
                                Head
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {household.hasCluster && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                          Potential Disease Cluster Detected
                        </p>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                        Multiple members showing similar symptoms - requires investigation
                      </p>
                    </div>
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

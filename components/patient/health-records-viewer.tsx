"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Activity, Heart, Calendar, User } from "lucide-react"

type Visit = {
  id: string
  visitDate: string
  visitTime?: string
  visitType: string
  status: string
  notes?: string
  vhv?: {
    firstName: string
    lastName: string
  }
}

type VitalSign = {
  id: string
  recordedAt: string
  temperature?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  weight?: number
  height?: number
  oxygenSaturation?: number
  recordedBy?: {
    firstName: string
    lastName: string
  }
}

type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  notes?: string
  prescribedBy?: {
    firstName: string
    lastName: string
  }
}

type Props = {
  visits: Visit[]
  vitalSigns: VitalSign[]
  medications: Medication[]
}

export function HealthRecordsViewer({ visits, vitalSigns, medications }: Props) {
  return (
    <Tabs defaultValue="visits" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="visits" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Visit Records
        </TabsTrigger>
        <TabsTrigger value="vitals" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Vital Signs
        </TabsTrigger>
        <TabsTrigger value="medications" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Medications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visits" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Visit History</CardTitle>
            <CardDescription>Your medical visits and consultations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No visit records found</p>
              </div>
            ) : (
              visits.map((visit) => (
                <Card key={visit.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(visit.visitDate).toLocaleDateString()}
                          {visit.visitTime && ` at ${visit.visitTime}`}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">Type: {visit.visitType}</p>
                      </div>
                      <Badge variant={visit.status === "COMPLETED" ? "default" : "secondary"}>{visit.status}</Badge>
                    </div>

                    {visit.vhv && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>
                          Conducted by: {visit.vhv.firstName} {visit.vhv.lastName}
                        </span>
                      </div>
                    )}

                    {visit.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Visit Notes:</p>
                        <p className="text-sm text-muted-foreground">{visit.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vitals" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs History</CardTitle>
            <CardDescription>Your recorded vital signs measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vitalSigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No vital signs recorded</p>
              </div>
            ) : (
              vitalSigns.map((vital) => (
                <Card key={vital.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{new Date(vital.recordedAt).toLocaleDateString()}</h4>
                        {vital.recordedBy && (
                          <p className="text-sm text-muted-foreground">
                            Recorded by: {vital.recordedBy.firstName} {vital.recordedBy.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                      {vital.temperature && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="text-lg font-semibold">{vital.temperature}°C</p>
                        </div>
                      )}
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                          <p className="text-lg font-semibold">
                            {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          </p>
                        </div>
                      )}
                      {vital.heartRate && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Heart Rate</p>
                          <p className="text-lg font-semibold">{vital.heartRate} bpm</p>
                        </div>
                      )}
                      {vital.weight && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-lg font-semibold">{vital.weight} kg</p>
                        </div>
                      )}
                      {vital.height && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-lg font-semibold">{vital.height} cm</p>
                        </div>
                      )}
                      {vital.oxygenSaturation && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">O2 Saturation</p>
                          <p className="text-lg font-semibold">{vital.oxygenSaturation}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="medications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Medication History</CardTitle>
            <CardDescription>Your prescribed medications and treatments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {medications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No medications prescribed</p>
              </div>
            ) : (
              medications.map((med) => (
                <Card key={med.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{med.name}</h4>
                        {med.prescribedBy && (
                          <p className="text-sm text-muted-foreground">
                            Prescribed by: Dr. {med.prescribedBy.firstName} {med.prescribedBy.lastName}
                          </p>
                        )}
                      </div>
                      <Badge variant={med.endDate ? "secondary" : "default"}>
                        {med.endDate ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Dosage</p>
                        <p className="text-sm font-medium">{med.dosage}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Frequency</p>
                        <p className="text-sm font-medium">{med.frequency}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">{new Date(med.startDate).toLocaleDateString()}</p>
                      </div>
                      {med.endDate && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="text-sm font-medium">{new Date(med.endDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {med.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{med.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

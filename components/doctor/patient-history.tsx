"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Calendar, User, FileText } from "lucide-react"

interface HistoryRecord {
  id: string
  created_at: string
  symptoms: string
  blood_pressure: string | null
  heart_rate: number | null
  temperature: number | null
  notes: string | null
  status: string
  doctor_notes: string | null
  reviewed_at: string | null
  users: {
    full_name: string
  }
}

interface PatientHistoryProps {
  patientId: string
  currentRecordId?: string
}

export function PatientHistory({ patientId, currentRecordId }: PatientHistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchPatientHistory()
  }, [patientId])

  const fetchPatientHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("visit_records")
        .select(`
          id,
          created_at,
          symptoms,
          blood_pressure,
          heart_rate,
          temperature,
          notes,
          status,
          doctor_notes,
          reviewed_at,
          users!vhv_id(full_name)
        `)
        .eq("patient_id", patientId)
        .neq("status", "draft")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Filter out current record if provided
      const filteredHistory = currentRecordId ? data?.filter((record) => record.id !== currentRecordId) : data

      setHistory(filteredHistory || [])
    } catch (error) {
      console.error("Error fetching patient history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Patient History ({history.length})
        </CardTitle>
        <CardDescription>Previous visit records for this patient</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No previous records found</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {history.map((record, index) => (
                <div key={record.id}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{new Date(record.created_at).toLocaleDateString()}</span>
                        <Badge variant={getStatusColor(record.status) as any}>{record.status}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {record.users.full_name}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Symptoms:</p>
                        <p>{record.symptoms}</p>
                      </div>

                      {/* Vital Signs */}
                      {(record.blood_pressure || record.heart_rate || record.temperature) && (
                        <div>
                          <p className="font-medium text-muted-foreground">Vital Signs:</p>
                          <div className="flex gap-4 text-xs">
                            {record.blood_pressure && <span>BP: {record.blood_pressure}</span>}
                            {record.heart_rate && <span>HR: {record.heart_rate} BPM</span>}
                            {record.temperature && <span>Temp: {record.temperature}°C</span>}
                          </div>
                        </div>
                      )}

                      {/* VHV Notes */}
                      {record.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground">VHV Notes:</p>
                          <p className="text-xs">{record.notes}</p>
                        </div>
                      )}

                      {/* Doctor Notes */}
                      {record.doctor_notes && (
                        <div>
                          <p className="font-medium text-muted-foreground">Doctor Notes:</p>
                          <p className="text-xs">{record.doctor_notes}</p>
                        </div>
                      )}

                      {record.reviewed_at && (
                        <p className="text-xs text-muted-foreground">
                          Reviewed: {new Date(record.reviewed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {index < history.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

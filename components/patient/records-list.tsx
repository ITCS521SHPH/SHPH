"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { FileText, Search, Filter, Calendar, User, ChevronDown, ChevronRight, MessageSquare } from "lucide-react"

interface VisitRecord {
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

interface RecordsListProps {
  patientId: string
  title: string
  description: string
}

export function RecordsList({ patientId, title, description }: RecordsListProps) {
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<VisitRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    fetchRecords()
  }, [patientId])

  useEffect(() => {
    filterRecords()
  }, [records, searchTerm, statusFilter])

  const fetchRecords = async () => {
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
      setRecords(data || [])
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterRecords = () => {
    let filtered = records

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.doctor_notes && record.doctor_notes.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    setFilteredRecords(filtered)
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "approved":
        return "Your visit has been reviewed and approved by a doctor"
      case "rejected":
        return "Your visit needs additional information or follow-up"
      case "pending":
        return "Your visit is waiting for doctor review"
      default:
        return "Status unknown"
    }
  }

  const toggleExpanded = (recordId: string) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRecords(newExpanded)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title} ({records.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search symptoms, VHV, or doctor notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const isExpanded = expandedRecords.has(record.id)

              return (
                <Collapsible key={record.id} open={isExpanded} onOpenChange={() => toggleExpanded(record.id)}>
                  <Card className="border-l-4 border-l-primary/20">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getStatusColor(record.status) as any}>{record.status}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                VHV: {record.users.full_name}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{getStatusDescription(record.status)}</p>
                            <p className="text-sm line-clamp-2">{record.symptoms}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <Separator />

                          {/* Full Symptoms */}
                          <div>
                            <h4 className="font-medium mb-2">Symptoms Reported</h4>
                            <p className="text-sm bg-muted p-3 rounded-lg">{record.symptoms}</p>
                          </div>

                          {/* Vital Signs */}
                          {(record.blood_pressure || record.heart_rate || record.temperature) && (
                            <div>
                              <h4 className="font-medium mb-2">Vital Signs</h4>
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                                  <p className="font-medium">{record.blood_pressure || "Not recorded"}</p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                                  <p className="font-medium">
                                    {record.heart_rate ? `${record.heart_rate} BPM` : "Not recorded"}
                                  </p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground">Temperature</p>
                                  <p className="font-medium">
                                    {record.temperature ? `${record.temperature}°C` : "Not recorded"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* VHV Notes */}
                          {record.notes && (
                            <div>
                              <h4 className="font-medium mb-2">VHV Observations</h4>
                              <p className="text-sm bg-muted p-3 rounded-lg">{record.notes}</p>
                            </div>
                          )}

                          {/* Doctor Notes */}
                          {record.doctor_notes && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Doctor's Notes
                              </h4>
                              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <p className="text-sm">{record.doctor_notes}</p>
                                {record.reviewed_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Reviewed on {new Date(record.reviewed_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {record.status === "pending" && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                Your visit record is currently being reviewed by a doctor. You will be notified once the
                                review is complete.
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}

            {filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No records found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No records match your search criteria."
                    : "No visit records available yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

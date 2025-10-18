"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, User } from "lucide-react"

// React Leaflet components via dynamic import to avoid SSR issues
const MapContainer: any = dynamic(async () => (await import("react-leaflet")).MapContainer as any, { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const Marker: any = dynamic(async () => (await import("react-leaflet")).Marker as any, { ssr: false })
const Popup: any = dynamic(async () => (await import("react-leaflet")).Popup as any, { ssr: false })

type Patient = {
  id: string
  firstName: string
  lastName: string
  address: string
  phone?: string
  district?: string
  medicalCondition?: string
  lastVisit?: string
}

type Props = {
  patients: Patient[]
}

// Helper function to geocode address (simplified - in production use a real geocoding service)
function geocodeAddress(address: string, district?: string): [number, number] | null {
  // Bangkok center coordinates
  const bangkokCenter: [number, number] = [13.7563, 100.5018]

  // Simple hash-based coordinate generation for demo purposes
  // In production, use a real geocoding API like Google Maps or OpenStreetMap Nominatim
  const hash = (address + (district || "")).split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Generate coordinates within Bangkok area (roughly ±0.1 degrees)
  const latOffset = ((hash % 200) - 100) / 1000 // -0.1 to +0.1
  const lngOffset = (((hash * 7) % 200) - 100) / 1000

  return [bangkokCenter[0] + latOffset, bangkokCenter[1] + lngOffset]
}

export function PatientMap({ patients }: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")
  const [districtFilter, setDistrictFilter] = useState<string>("__ALL__")

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])

  // Get unique districts from patients
  const districts = useMemo(() => {
    const districtSet = new Set<string>()
    patients.forEach((p) => {
      if (p.district) districtSet.add(p.district)
    })
    return Array.from(districtSet).sort()
  }, [patients])

  // Filter patients based on search and district
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return patients.filter((p) => {
      const inDistrict = districtFilter === "__ALL__" ? true : p.district === districtFilter
      if (!inDistrict) return false
      if (!term) return true
      const full = `${p.firstName} ${p.lastName} ${p.address} ${p.phone || ""} ${p.district || ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [patients, search, districtFilter])

  // Add coordinates to filtered patients
  const patientsWithCoords = useMemo(() => {
    return filtered
      .map((p) => {
        const coords = geocodeAddress(p.address, p.district)
        if (!coords) return null
        return { ...p, coords }
      })
      .filter((p): p is Patient & { coords: [number, number] } => p !== null)
  }, [filtered])

  // Fit bounds to show all markers
  useEffect(() => {
    const m = mapRef.current
    if (!m || patientsWithCoords.length === 0) return

    try {
      const L = (window as any).L
      if (L && patientsWithCoords.length > 0) {
        const bounds = new L.LatLngBounds(patientsWithCoords.map((p) => p.coords))
        if (bounds && m.fitBounds) {
          m.fitBounds(bounds.pad(0.2), { animate: true })
        }
      }
    } catch (error) {
      console.error("Error fitting bounds:", error)
    }
  }, [patientsWithCoords])

  useEffect(() => {
    const map = mapRef.current
    if (map && map.invalidateSize) {
      setTimeout(() => {
        map.invalidateSize()
      }, 800)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name, address, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-64">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger aria-label="Filter by district">
              <SelectValue placeholder="Filter by district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">All districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Badge variant="outline">Patients: {patientsWithCoords.length}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[65vh] w-full">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef as any}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {patientsWithCoords.map((patient) => (
                <Marker key={patient.id} position={patient.coords}>
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <div className="font-semibold text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {patient.firstName} {patient.lastName}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <span>{patient.address}</span>
                        </div>

                        {patient.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{patient.phone}</span>
                          </div>
                        )}

                        {patient.district && (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {patient.district}
                            </Badge>
                          </div>
                        )}

                        {patient.medicalCondition && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground">Condition:</div>
                            <div className="font-medium">{patient.medicalCondition}</div>
                          </div>
                        )}

                        {patient.lastVisit && (
                          <div className="text-xs text-muted-foreground">
                            Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientMap

"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, User } from "lucide-react"

// React Leaflet components via dynamic import to avoid SSR issues
const MapContainer: any = dynamic(async () => (await import("react-leaflet")).MapContainer as any, { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const CircleMarker: any = dynamic(async () => (await import("react-leaflet")).CircleMarker as any, { ssr: false })
const Popup: any = dynamic(async () => (await import("react-leaflet")).Popup as any, { ssr: false })
const Tooltip: any = dynamic(async () => (await import("react-leaflet")).Tooltip as any, { ssr: false })
const Circle: any = dynamic(async () => (await import("react-leaflet")).Circle as any, { ssr: false })

// Types
type Patient = {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  district?: string
  medicalCondition?: string
  lastVisit?: string
}

type Props = {
  patients: Patient[]
}

// Helpers
function getPatientLabel(p: Patient) {
  if (p.name && p.name.trim().length > 0) {
    return p.name
  }
  const combined = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
  if (combined) {
    return combined
  }
  if (p.email) return p.email
  if (p.phone) return p.phone
  return "Patient"
}

// Main Component
export function PatientMap({ patients }: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")
  const ALL_DISTRICTS = "__ALL__"
  const [districtFilter, setDistrictFilter] = useState<string>(ALL_DISTRICTS)

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (patients || []).filter((p) => {
      const inDistrict = districtFilter === ALL_DISTRICTS ? true : (p.district || "") === districtFilter
      if (!inDistrict) return false
      if (!term) return true
      const full = `${p.firstName ?? ""} ${p.lastName ?? ""} ${p.name ?? ""} ${
        p.email ?? ""
      } ${p.phone ?? ""} ${p.district ?? ""} ${p.address ?? ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [patients, search, districtFilter])

  const districtGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        displayName: string
        rawDistrict: string | undefined
        items: Patient[]
      }
    >()

    filtered.forEach((patient) => {
      const rawDistrict = patient.district?.trim()
      const displayName = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "Unknown district"
      const key = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "__UNKNOWN__"
      const existing = map.get(key)
      if (existing) {
        existing.items.push(patient)
      } else {
        map.set(key, { displayName, rawDistrict, items: [patient] })
      }
    })

    return Array.from(map.entries()).map(([key, value]) => {
      const anchor = getDistrictAnchor(value.rawDistrict ?? "")
      const colorSource = value.rawDistrict && value.rawDistrict.length > 0 ? value.rawDistrict : value.displayName
      return {
        key,
        displayName: value.displayName,
        color: colorForDistrict(colorSource),
        anchor,
        items: value.items,
      }
    })
  }, [filtered])

  // Fit bounds to filtered markers
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    if (districtGroups.length === 0) return
    const latlngs = districtGroups.map((group) => group.anchor)
    try {
      const L = (window as any).L
      if (L && Array.isArray(latlngs) && latlngs.length > 0) {
        const bounds = new L.LatLngBounds(latlngs)
        if (bounds && m.fitBounds) {
          m.fitBounds(bounds.pad(0.2), { animate: true })
        }
      }
    } catch {}
  }, [districtGroups])

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
              <SelectItem value={ALL_DISTRICTS}>All districts</SelectItem>
              {BANGKOK_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Badge variant="outline">Patients: {filtered.length}</Badge>
          {districtFilter !== ALL_DISTRICTS && (
            <Badge
              style={{
                backgroundColor: colorForDistrict(districtFilter),
                color: "#fff",
              }}
            >
              {districtFilter}
            </Badge>
          )}
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

              {districtFilter !== ALL_DISTRICTS && (
                <Circle
                  center={getDistrictAnchor(districtFilter)}
                  radius={AREA_RADIUS_M}
                  pathOptions={{
                    color: colorForDistrict(districtFilter),
                    weight: 2,
                    fillOpacity: 0.05,
                  }}
                />
              )}

              {districtGroups.map((group) => {
                const tooltipLabel = `${group.displayName} (${group.items.length})`
                return (
                  <CircleMarker
                    key={group.key}
                    center={group.anchor}
                    radius={10}
                    pathOptions={{
                      color: group.color,
                      fillColor: group.color,
                      fillOpacity: 0.85,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                      <span>{tooltipLabel}</span>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold leading-tight">{group.displayName}</div>
                          <Badge variant="outline">
                            {group.items.length} Patient
                            {group.items.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-1">
                          <div className="space-y-2">
                            {group.items.map((p) => (
                              <div key={p.id} className="rounded border border-border bg-background/60 p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <div className="font-medium leading-tight">{getPatientLabel(p)}</div>
                                </div>
                                {p.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {p.phone}
                                  </div>
                                )}
                                {p.address && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {p.address}
                                  </div>
                                )}
                                {p.medicalCondition && (
                                  <div className="text-sm mt-1">
                                    <span className="text-muted-foreground">Condition: </span>
                                    <span className="font-medium">{p.medicalCondition}</span>
                                  </div>
                                )}
                                {p.lastVisit && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Last visit: {new Date(p.lastVisit).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientMap

"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Dynamic import to avoid SSR issues
const MapContainer: any = dynamic(async () => (await import("react-leaflet")).MapContainer as any, { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const Circle: any = dynamic(async () => (await import("react-leaflet")).Circle as any, { ssr: false })
const CircleMarker: any = dynamic(async () => (await import("react-leaflet")).CircleMarker as any, { ssr: false })
const Popup: any = dynamic(async () => (await import("react-leaflet")).Popup as any, { ssr: false })
const Tooltip: any = dynamic(async () => (await import("react-leaflet")).Tooltip as any, { ssr: false })

// Leaflet CSS + global L for simple bounds
if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("leaflet/dist/leaflet.css")
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ;(window as any).L = require("leaflet")
  } catch {}
}

export type VhvLite = {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  district?: string
  status?: string
}

type Props = {
  vhvs: VhvLite[]
  selectedDistricts: string[]
  onToggleDistrict: (district: string) => void
  selectedVhvIds: string[]
  onToggleVhv: (vhvId: string) => void
  mode?: "area" | "patient"
}

export function VhvMapSelector({ vhvs, selectedDistricts, onToggleDistrict, selectedVhvIds, onToggleVhv, mode = "area" }: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])
  const selectedSet = useMemo(() => new Set(selectedDistricts), [selectedDistricts])
  const selectedVhvSet = useMemo(() => new Set(selectedVhvIds), [selectedVhvIds])

  const displayVHVs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (vhvs || []).filter(v => {
      const inArea = selectedSet.size === 0 ? true : selectedSet.has((v.district || "").trim())
      if (!inArea) return false
      if (!term) return true
      const full = `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.name ?? ""} ${v.email ?? ""} ${v.phone ?? ""} ${v.district ?? ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [vhvs, selectedSet, search])

  // Fit map to shown VHVs or selected districts
  useEffect(() => {
    const m = mapRef.current
    const L = (typeof window !== "undefined" ? (window as any).L : null)
    if (!m || !L) return
    const latlngs: [number, number][] = []
    if (selectedDistricts.length > 0) {
      selectedDistricts.forEach(d => latlngs.push(getDistrictAnchor(d)))
    } else {
      displayVHVs.forEach(v => latlngs.push(getDistrictAnchor(v.district || "")))
    }
    if (latlngs.length > 0) {
      try {
        const b = new L.LatLngBounds(latlngs)
        m.fitBounds(b.pad(0.2), { animate: true })
      } catch {}
    }
  }, [displayVHVs, selectedDistricts])

  const districts = BANGKOK_DISTRICTS

  const vhvCountByDistrict = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of vhvs || []) {
      const d = (v.district || "").trim()
      if (!d) continue
      map.set(d, (map.get(d) || 0) + 1)
    }
    return map
  }, [vhvs])

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Input placeholder="Search VHV by name/email/phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Badge variant="outline">VHVs: {displayVHVs.length}</Badge>
          {selectedDistricts.length > 0 && (
            <Badge variant="outline">Areas: {selectedDistricts.length}</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => selectedDistricts.forEach(d => onToggleDistrict(d))} disabled={selectedDistricts.length === 0}>
            Clear Areas
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[60vh] w-full">
            <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }} ref={mapRef as any}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* District anchors (click to toggle selection) */}
              {districts.map((d) => {
                const pos = getDistrictAnchor(d)
                const sel = selectedSet.has(d)
                const color = colorForDistrict(d)
                const count = vhvCountByDistrict.get(d) || 0
                return (
                  <CircleMarker key={`area-${d}`} center={pos} radius={sel ? 10 : 6} pathOptions={{ color, fillColor: color, fillOpacity: sel ? 0.9 : 0.5 }} eventHandlers={{ click: () => onToggleDistrict(d) }}>
                    <Tooltip direction="right" offset={[10, 0]} opacity={1} permanent={false}>
                      <span>{d} • {count} VHV{count === 1 ? '' : 's'} (click to {sel ? 'remove' : 'select'})</span>
                    </Tooltip>
                  </CircleMarker>
                )
              })}

              {/* Highlight selected areas */}
              {selectedDistricts.map((d) => (
                <Circle key={`hl-${d}`} center={getDistrictAnchor(d)} radius={AREA_RADIUS_M} pathOptions={{ color: colorForDistrict(d), weight: 2, fillOpacity: 0.04 }} />
              ))}

              {/* VHV markers (filtered by selected areas) */}
              {displayVHVs.map((v) => {
                const pos = getDistrictAnchor(v.district || "")
                const color = colorForDistrict(v.district || "")
                const label = v.name || `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email || "VHV"
                const isSelected = selectedVhvSet.has(v.id)
                return (
                  <CircleMarker
                    key={v.id}
                    center={pos}
                    radius={isSelected ? 9 : 7}
                    pathOptions={{ color: isSelected ? "#000" : color, weight: isSelected ? 2 : 1, fillColor: color, fillOpacity: 0.9 }}
                    eventHandlers={{ click: () => onToggleVhv(v.id) }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                      <span>{label}</span>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-medium">{label}</div>
                        {v.phone && <div className="text-sm text-muted-foreground">Phone: {v.phone}</div>}
                        {v.email && <div className="text-sm text-muted-foreground">Email: {v.email}</div>}
                        {v.district && (
                          <div className="text-sm">Base area: <span className="font-medium">{v.district}</span></div>
                        )}
                        <div className="pt-1">
                          <Button size="sm" variant={isSelected ? "secondary" : "default"} onClick={() => onToggleVhv(v.id)}>
                            {isSelected ? "Unselect" : "Select"}
                          </Button>
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

export default VhvMapSelector


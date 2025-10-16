"use client"

import { useEffect, useMemo, useRef, useState } from "react"
// Don't import 'leaflet' at module top-level to avoid preview environments
// rewriting it into a blob URL with an incorrect MIME type. Prefer the
// global `window.L` loaded from CDN (app/layout.tsx). Fall back to
// requiring it at runtime in client-only code paths.
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

// Leaflet CSS is imported in the app root layout to ensure it's treated as global CSS
// and served with the correct MIME type by the Next.js dev/preview server.

// We initialize Leaflet from the CDN-provided global `L` (app/layout.tsx)
// to avoid bundling the `leaflet` package into client chunks that some
// preview environments rewrite into remote ESM requests.

type VHV = {
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
  vhvs: VHV[]
}

function getVhvLabel(v: VHV) {
  if (v.name && v.name.trim().length > 0) {
    return v.name
  }
  const combined = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim()
  if (combined) {
    return combined
  }
  if (v.email) return v.email
  if (v.phone) return v.phone
  return "VHV"
}

export function VhvMap({ vhvs }: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")
  const ALL_DISTRICTS = "__ALL__"
  const [districtFilter, setDistrictFilter] = useState<string>(ALL_DISTRICTS)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (vhvs || []).filter((v) => {
      const inDistrict = districtFilter === ALL_DISTRICTS ? true : (v.district || "") === districtFilter
      if (!inDistrict) return false
      if (!term) return true
      const full =
        `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.name ?? ""} ${v.email ?? ""} ${v.phone ?? ""} ${v.district ?? ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [vhvs, search, districtFilter])

  const districtGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        displayName: string
        rawDistrict: string | undefined
        items: VHV[]
      }
    >()

    filtered.forEach((vhv) => {
      const rawDistrict = vhv.district?.trim()
      const displayName = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "Unknown district"
      const key = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "__UNKNOWN__"
      const existing = map.get(key)
      if (existing) {
        existing.items.push(vhv)
      } else {
        map.set(key, { displayName, rawDistrict, items: [vhv] })
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // prefer CDN global
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const L = (window as any).L ?? require("leaflet")
        // Fix default marker icon issue with Leaflet in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      } catch (err) {
        // ignore
      }
    }
  }, [])

  // Fit bounds to filtered markers
  useEffect(() => {
    if (!leafletLoaded) return

    const m = mapRef.current
    if (!m) return
    if (districtGroups.length === 0) return

    const latlngs = districtGroups.map((group) => group.anchor)
    if (Array.isArray(latlngs) && latlngs.length > 0) {
      try {
        // prefer global L
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const L = (window as any).L ?? require("leaflet")
        const bounds = new L.LatLngBounds(latlngs)
        if (bounds && m.fitBounds) {
          m.fitBounds(bounds.pad(0.2), { animate: true })
        }
      } catch (err) {
        // ignore
      }
    }
  }, [districtGroups, leafletLoaded])

  const mapElRef = useRef<HTMLDivElement | null>(null)
  const layerGroupRef = useRef<any>(null)
  const highlightLayerRef = useRef<any>(null)

  // Initialize the map element when Leaflet is ready
  useEffect(() => {
    if (!leafletLoaded) return
    if (!mapElRef.current) return
    const L = (window as any).L
    if (!L) return

    if (!mapRef.current) {
      const map = L.map(mapElRef.current, {
        center: [center.lat, center.lng],
        zoom: 12,
        preferCanvas: true,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      const lg = L.layerGroup().addTo(map)
      const hl = L.layerGroup().addTo(map)
      mapRef.current = map
      layerGroupRef.current = lg
      highlightLayerRef.current = hl
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, [leafletLoaded, center.lat, center.lng])

  // Render the map UI
  if (!leafletLoaded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center h-[65vh] w-full bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email or phone"
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
          <Badge variant="outline">VHVs: {filtered.length}</Badge>
          {districtFilter !== ALL_DISTRICTS && (
            <Badge style={{ backgroundColor: colorForDistrict(districtFilter), color: "#fff" }}>{districtFilter}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
              <div className="h-[65vh] w-full">
                <div ref={mapElRef} style={{ height: "100%", width: "100%" }} />
              </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VhvMap

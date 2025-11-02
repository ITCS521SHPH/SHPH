"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDistrictAnchor,
  colorForDistrict,
  AREA_RADIUS_M,
} from "@/lib/district-geo";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// React Leaflet components via dynamic import to avoid SSR issues
const MapContainer: any = dynamic(
  async () => (await import("react-leaflet")).MapContainer as any,
  { ssr: false }
);
const TileLayer: any = dynamic(
  async () => (await import("react-leaflet")).TileLayer as any,
  { ssr: false }
);
const CircleMarker: any = dynamic(
  async () => (await import("react-leaflet")).CircleMarker as any,
  { ssr: false }
);
const Popup: any = dynamic(
  async () => (await import("react-leaflet")).Popup as any,
  { ssr: false }
);
const Tooltip: any = dynamic(
  async () => (await import("react-leaflet")).Tooltip as any,
  { ssr: false }
);
const Circle: any = dynamic(
  async () => (await import("react-leaflet")).Circle as any,
  { ssr: false }
);

// ---------------------------
// Types
// ---------------------------
type VHV = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  district?: string;
  status?: string;
};

type Props = {
  vhvs: VHV[];
};

// ---------------------------
// Helpers
// ---------------------------
function getVhvLabel(v: VHV) {
  if (v.name && v.name.trim().length > 0) {
    return v.name;
  }
  const combined = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim();
  if (combined) {
    return combined;
  }
  if (v.email) return v.email;
  if (v.phone) return v.phone;
  return "VHV";
}

// ---------------------------
// Main Component
// ---------------------------
export function VhvMap({ vhvs }: Props) {
  const mapRef = useRef<any>(null);
  const [search, setSearch] = useState("");
  const ALL_DISTRICTS = "__ALL__";
  const [districtFilter, setDistrictFilter] = useState<string>(ALL_DISTRICTS);

  // Dynamically import Leaflet only on client
  // useEffect(() => {
  //   (async () => {
  //     if (typeof window !== "undefined") {
  //       try {
  //         await import("leaflet/dist/leaflet.css");
  //         const L = await import("leaflet");
  //         (window as any).L = L;
  //       } catch (err) {
  //         console.warn("Failed to load Leaflet dynamically", err);
  //       }
  //     }
  //   })();
  // }, []);

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (vhvs || []).filter((v) => {
      const inDistrict =
        districtFilter === ALL_DISTRICTS
          ? true
          : (v.district || "") === districtFilter;
      if (!inDistrict) return false;
      if (!term) return true;
      const full = `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.name ?? ""} ${
        v.email ?? ""
      } ${v.phone ?? ""} ${v.district ?? ""}`.toLowerCase();
      return full.includes(term);
    });
  }, [vhvs, search, districtFilter]);

  const districtGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        displayName: string;
        rawDistrict: string | undefined;
        items: VHV[];
      }
    >();

    filtered.forEach((vhv) => {
      const rawDistrict = vhv.district?.trim();
      const displayName =
        rawDistrict && rawDistrict.length > 0
          ? rawDistrict
          : "Unknown district";
      const key =
        rawDistrict && rawDistrict.length > 0 ? rawDistrict : "__UNKNOWN__";
      const existing = map.get(key);
      if (existing) {
        existing.items.push(vhv);
      } else {
        map.set(key, { displayName, rawDistrict, items: [vhv] });
      }
    });

    return Array.from(map.entries()).map(([key, value]) => {
      const anchor = getDistrictAnchor(value.rawDistrict ?? "");
      const colorSource =
        value.rawDistrict && value.rawDistrict.length > 0
          ? value.rawDistrict
          : value.displayName;
      return {
        key,
        displayName: value.displayName,
        color: colorForDistrict(colorSource),
        anchor,
        items: value.items,
      };
    });
  }, [filtered]);

  // Fit bounds to filtered markers
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (districtGroups.length === 0) return;
    const latlngs = districtGroups.map((group) => group.anchor);
    try {
      const L = (window as any).L;
      if (L && Array.isArray(latlngs) && latlngs.length > 0) {
        const bounds = new L.LatLngBounds(latlngs);
        if (bounds && m.fitBounds) {
          m.fitBounds(bounds.pad(0.2), { animate: true });
        }
      }
    } catch {}
  }, [districtGroups]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.invalidateSize) {
      // wait a little for styles to fully apply before re-rendering tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 800);
    }
  }, []);

  // ---------------------------
  // Render
  // ---------------------------
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
        <CardContent className="p-0 z-0">
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
                const tooltipLabel = `${group.displayName} (${group.items.length})`;
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
                    <Tooltip
                      direction="top"
                      offset={[0, -10]}
                      opacity={1}
                      permanent={false}
                    >
                      <span>{tooltipLabel}</span>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold leading-tight">
                            {group.displayName}
                          </div>
                          <Badge variant="outline">
                            {group.items.length} VHV
                            {group.items.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-1">
                          <div className="space-y-2">
                            {group.items.map((v) => (
                              <div
                                key={v.id}
                                className="rounded border border-border bg-background/60 p-2"
                              >
                                <div className="font-medium leading-tight">
                                  {getVhvLabel(v)}
                                </div>
                                {v.phone && (
                                  <div className="text-sm text-muted-foreground">
                                    Phone: {v.phone}
                                  </div>
                                )}
                                {v.email && (
                                  <div className="text-sm text-muted-foreground">
                                    Email: {v.email}
                                  </div>
                                )}
                                {(v.district || group.displayName) && (
                                  <div className="text-sm">
                                    Base area:{" "}
                                    <span className="font-medium">
                                      {v.district || group.displayName}
                                    </span>
                                  </div>
                                )}
                                {v.status && (
                                  <div className="text-xs text-muted-foreground">
                                    Status: {v.status}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VhvMap;

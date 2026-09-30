import React, { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { cn } from "../lib/utils";

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lng) {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  return null;
}

export default function LocationPicker({ lat, lng, onChange, className }: LocationPickerProps) {
  // If lat/lng are 0 or not provided, default to Phnom Penh center
  const defaultLat = lat || 11.5564;
  const defaultLng = lng || 104.9282;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    return (
      <div className={cn("h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-6 text-center z-0", className)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
        <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">Google Maps Not Configured</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
          Please add <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to your environment variables to enable the location picker.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0", className)}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: defaultLat, lng: defaultLng }}
          defaultZoom={14}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          onClick={(e) => {
            if (e.detail.latLng) {
              onChange(e.detail.latLng.lat, e.detail.latLng.lng);
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <MapController lat={defaultLat} lng={defaultLng} />
          <AdvancedMarker position={{ lat: defaultLat, lng: defaultLng }} />
        </Map>
      </APIProvider>
    </div>
  );
}

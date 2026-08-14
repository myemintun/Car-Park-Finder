/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { EnrichedCarpark, TaxiSummaryResponse } from '../types';
import { 
  Zap, 
  Car, 
  MapPin, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Navigation,
  Compass,
  Radio
} from 'lucide-react';

interface LiveMapProps {
  carparks: EnrichedCarpark[];
  selectedCarpark: EnrichedCarpark | null;
  onSelectCarpark: (carpark: EnrichedCarpark) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const SG_AREAS = [
  { name: 'All Singapore', lat: 1.3521, lng: 103.8198, zoom: 12 },
  { name: 'Marina Bay / CBD', lat: 1.2838, lng: 103.8540, zoom: 14 },
  { name: 'Orchard Rd', lat: 1.3035, lng: 103.8340, zoom: 15 },
  { name: 'Bugis / City Hall', lat: 1.2990, lng: 103.8545, zoom: 15 },
  { name: 'Jurong East', lat: 1.3360, lng: 103.7440, zoom: 14 },
  { name: 'Tampines', lat: 1.3530, lng: 103.9440, zoom: 14 },
  { name: 'Bishan / AMK', lat: 1.3580, lng: 103.8490, zoom: 14 },
  { name: 'Bedok', lat: 1.3240, lng: 103.9300, zoom: 14 },
  { name: 'Woodlands', lat: 1.4360, lng: 103.7870, zoom: 14 },
  { name: 'Punggol', lat: 1.4050, lng: 103.9030, zoom: 14 },
];

export const LiveMap: React.FC<LiveMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  favorites,
  onToggleFavorite,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const taxiGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [activeArea, setActiveArea] = useState('All Singapore');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTaxis, setShowTaxis] = useState(false);
  const [taxiData, setTaxiData] = useState<TaxiSummaryResponse | null>(null);
  const [loadingTaxis, setLoadingTaxis] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198],
        zoom: 12,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
      });

      // Dark CartoDB Tiles for contrast
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      const taxiGroup = L.layerGroup().addTo(map);
      taxiGroupRef.current = taxiGroup;

      mapInstanceRef.current = map;
    }
  }, []);

  // Fetch Live Taxis
  const fetchTaxis = async () => {
    setLoadingTaxis(true);
    try {
      const res = await fetch('/api/taxis');
      const data = await res.json();
      if (data.success) {
        setTaxiData(data);
      }
    } catch (err) {
      console.warn('Failed to load taxi availability:', err);
    } finally {
      setLoadingTaxis(false);
    }
  };

  useEffect(() => {
    if (showTaxis && !taxiData) {
      fetchTaxis();
    }
  }, [showTaxis, taxiData]);

  // Render Taxi Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !taxiGroupRef.current) return;

    taxiGroupRef.current.clearLayers();

    if (!showTaxis || !taxiData) return;

    // Render taxi coordinates (sampled)
    taxiData.coordinates.forEach(([lng, lat]) => {
      const taxiIcon = L.divIcon({
        className: 'taxi-dot-marker',
        html: `<div class="w-3 h-3 rounded-full bg-amber-400 border border-zinc-900 shadow-sm opacity-80 hover:opacity-100 hover:scale-125 transition-transform" title="Available Taxi"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([lat, lng], { icon: taxiIcon });
      marker.bindPopup(`
        <div class="p-3 bg-white text-zinc-900 text-xs font-bold border-2 border-zinc-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
          <div class="flex items-center gap-1.5 text-amber-600 font-black mb-1">
            <span>🚕</span> Available Taxi (data.gov.sg v1)
          </div>
          <p class="text-[11px] text-zinc-600 font-medium">Cruising for passenger pickup.</p>
        </div>
      `);
      taxiGroupRef.current?.addLayer(marker);
    });
  }, [showTaxis, taxiData]);

  // Update User Location Beacon
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-md text-zinc-900 font-black">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 2000,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="p-4 bg-white text-zinc-900 text-xs font-bold border-2 border-zinc-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div class="flex items-center gap-1.5 text-emerald-600 mb-1 font-black uppercase">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Your Position
          </div>
          <p class="text-zinc-600 font-semibold">Live GPS position calibrated for proximity sorting.</p>
        </div>
      `);

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update Markers when carparks change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    carparks.forEach((cp) => {
      const avail = cp.lots_summary.available_car_lots;
      const total = cp.lots_summary.total_car_lots;
      const occ = cp.lots_summary.occupancy_rate;

      let colorClass = 'bg-emerald-500 border-zinc-900 text-zinc-950';
      if (avail === 0) {
        colorClass = 'bg-rose-500 border-zinc-900 text-white';
      } else if (avail < 15 || occ > 85) {
        colorClass = 'bg-amber-400 border-zinc-900 text-zinc-950';
      }

      const isFav = favorites.includes(cp.id);
      const isSelected = selectedCarpark?.id === cp.id;

      const markerHtml = `
        <div class="custom-carpark-marker group relative ${isSelected ? 'scale-125 z-50 ring-4 ring-white rounded-full' : ''}">
          <div class="flex items-center justify-center min-w-[40px] h-[34px] px-2 rounded-2xl border-2 ${colorClass} shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] font-mono font-black text-xs transition-transform duration-200">
            ${avail > 0 ? avail : '0'}
          </div>
          ${
            cp.has_ev_charging
              ? `<span class="absolute -top-1.5 -right-1.5 bg-zinc-900 text-amber-300 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow">⚡</span>`
              : ''
          }
          ${
            isFav
              ? `<span class="absolute -bottom-1.5 -right-1.5 bg-zinc-900 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow">★</span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'carpark-marker-wrapper',
        html: markerHtml,
        iconSize: [42, 38],
        iconAnchor: [21, 19],
      });

      const marker = L.marker([cp.latitude, cp.longitude], {
        icon: customIcon,
      });

      // Rich Bento popup
      const popupHtml = `
        <div class="p-4 bg-white text-zinc-900 min-w-[260px] max-w-[300px]">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="inline-block px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono font-black text-white">
                ${cp.carpark_number}
              </span>
              <h4 class="font-black text-sm text-zinc-900 mt-1 uppercase tracking-tight">${cp.name}</h4>
              <p class="text-[11px] font-bold text-zinc-500 leading-tight mt-0.5">${cp.address}</p>
            </div>
          </div>

          <div class="my-2.5 p-2.5 rounded-xl bg-zinc-100 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <div class="flex items-center justify-between text-xs mb-1 font-bold">
              <span class="text-zinc-600 uppercase text-[10px] tracking-wider">AVAILABLE LOTS</span>
              <span class="font-mono font-black ${avail > 15 ? 'text-emerald-700' : avail > 0 ? 'text-amber-700' : 'text-rose-700'}">
                ${avail} / ${total}
              </span>
            </div>
            <div class="w-full bg-zinc-300 rounded-full h-2 overflow-hidden border border-zinc-900">
              <div class="h-2 rounded-full ${avail > 15 ? 'bg-emerald-500' : avail > 0 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${100 - occ}%"></div>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 text-[10px] font-bold text-zinc-800 mb-3">
            <span class="px-2 py-0.5 rounded bg-zinc-200 border border-zinc-900">
              ${cp.car_park_type === 'MULTI-STOREY CAR PARK' ? '🏢 MSCP (Sheltered)' : cp.car_park_type === 'BASEMENT CAR PARK' ? '🅿️ Basement' : '🚗 Surface'}
            </span>
            <span class="px-2 py-0.5 rounded bg-zinc-200 border border-zinc-900">
              Max H: ${cp.gantry_height}m
            </span>
            ${cp.has_ev_charging ? '<span class="px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-zinc-900">⚡ EV Charging</span>' : ''}
          </div>

          <div class="pt-2 border-t-2 border-zinc-200 flex items-center justify-between gap-2">
            <button
              onclick="window.dispatchEvent(new CustomEvent('inspect-carpark', { detail: '${cp.id}' }))"
              class="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs text-center uppercase tracking-wider transition-colors border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            >
              Inspect Details
            </button>
            <a
              href="https://www.google.com/maps/search/?api=1&query=${cp.latitude},${cp.longitude}"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              title="Navigate"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [carparks, favorites, selectedCarpark, onSelectCarpark]);

  // Listen to custom popup event for "Inspect Details"
  useEffect(() => {
    const handleInspect = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const cp = carparks.find((c) => c.id === customEvent.detail);
      if (cp) {
        onSelectCarpark(cp);
      }
    };

    window.addEventListener('inspect-carpark', handleInspect);
    return () => window.removeEventListener('inspect-carpark', handleInspect);
  }, [carparks, onSelectCarpark]);

  // Center map on selected carpark
  useEffect(() => {
    if (selectedCarpark && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedCarpark.latitude, selectedCarpark.longitude], 16, {
        duration: 1.2,
      });
    }
  }, [selectedCarpark]);

  // Quick Area Navigation Jump
  const handleAreaJump = (area: (typeof SG_AREAS)[0]) => {
    setActiveArea(area.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([area.lat, area.lng], area.zoom, {
        duration: 1.0,
      });
    }
  };

  return (
    <div className={`relative flex flex-col w-full ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[380px] md:h-[480px] lg:h-[560px]'} bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]`}>
      
      {/* Area Quick Selector Header (Bento Pills) */}
      <div className="absolute top-3 left-3 right-16 z-[400] flex items-center gap-1.5 overflow-x-auto py-1 px-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] no-scrollbar">
        {/* Taxi Layer Toggle */}
        <button
          id="btn-toggle-taxis"
          onClick={() => setShowTaxis(!showTaxis)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 flex items-center gap-1.5 ${
            showTaxis
              ? 'bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'
          }`}
          title="Toggle Singapore Live Taxis (data.gov.sg v1)"
        >
          <span>🚕</span>
          <span>
            {showTaxis
              ? `TAXIS ON ${taxiData ? `(${taxiData.taxi_count.toLocaleString()})` : ''}`
              : 'LIVE TAXIS'}
          </span>
          {loadingTaxis && <span className="animate-spin text-[10px]">⏳</span>}
        </button>

        <div className="w-[1px] h-5 bg-zinc-700 mx-1"></div>

        {SG_AREAS.map((area) => (
          <button
            key={area.name}
            id={`btn-area-${area.name.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => handleAreaJump(area)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
              activeArea === area.name
                ? 'bg-white text-zinc-900 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {area.name}
          </button>
        ))}
      </div>

      {/* Fullscreen Toggle Button */}
      <button
        id="btn-toggle-fullscreen-map"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-3 right-3 z-[400] p-2.5 rounded-2xl bg-white text-zinc-900 border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:bg-zinc-100 transition-all"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Map Legend Bar (Bento Strip) */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/95 backdrop-blur-md border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-xs text-white">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-zinc-900 shadow-sm"></span>
            <span className="text-zinc-200 font-bold uppercase text-[11px]">Available (&gt;15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400 border border-zinc-900 shadow-sm"></span>
            <span className="text-zinc-200 font-bold uppercase text-[11px]">Filling Fast (&lt;15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-zinc-900 shadow-sm"></span>
            <span className="text-zinc-200 font-bold uppercase text-[11px]">Full (0 lots)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-zinc-700 text-[10px] font-black">⚡ EV</span>
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Charging</span>
          </div>
          {showTaxis && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-zinc-900 shadow-sm"></span>
              <span className="text-amber-300 font-bold uppercase text-[10px]">Active Taxi</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-zinc-400 font-mono font-bold uppercase hidden md:block">
          Select marker for clearance & occupancy
        </div>
      </div>
    </div>
  );
};
